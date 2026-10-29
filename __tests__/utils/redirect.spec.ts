import HttpCode from "../../src/http/HttpCode";
import HttpHeaders from "../../src/http/HttpHeaders";
import IC3Initializer from "../../src/core/IC3Initializer";
import Util from "../../src/common/Util";
import Utilities from "../../src/common/Utilities";

jest.mock("../../src/http/HttpClient", () => ({
	HttpClient: { MakeRequest: jest.fn() }
}));

describe("chat service redirect origins", () => {
	it.each([
		["https://region.microsoft.com/v1/users/ME/endpoints/123", "https://region.microsoft.com"],
		["https://REGION.microsoft.com/v1/subscriptions/123", "https://region.microsoft.com"],
		["http://region.microsoft.com/v1", "http://region.microsoft.com"],
		["https://region.microsoft.com:443/v1", "https://region.microsoft.com"]
	])("extracts a supported origin from %s", (location, origin) => {
		expect(Util.parseChatServiceHostUrl(location)).toBe(origin);
	});

	it.each([
		"https://outside.invalid/path/.microsoft.com/v1",
		"https://region.microsoft.com.outside.invalid/v1",
		"https://outside.invalid/?host=.microsoft.com",
		"https://user@region.microsoft.com/v1",
		"https://region.microsoft.com:8443/v1",
		"https://microsoft.com/v1",
		"ftp://region.microsoft.com/v1",
		"/v1/endpoints/123",
		"not a URL",
		""
	])("rejects an unsupported redirect %s", (location) => {
		expect(Util.parseDomain(location)).toBe(null);
	});

	it("keeps the legacy domain matcher within the URL authority", () => {
		expect("https://region.microsoft.com/v1".match(Util.getDomainRegexp())?.[1])
			.toBe("https://region.microsoft.com");
		expect(Util.getDomainRegexp().test("https://outside.invalid/path/.microsoft.com")).toBe(false);
		expect(Util.getDomainRegexp().test("https://region.microsoft.com.outside.invalid")).toBe(false);
	});

	describe("initializer redirect callbacks", () => {
		const originalOrigin = "https://original.microsoft.com";
		const logger = { log: jest.fn(), isLoggingEnabled: (): boolean => true };
		let initializer: IC3Initializer;

		beforeEach(async () => {
			initializer = new IC3Initializer();
			await initializer.setup(logger);
			await initializer.setIc3Info({
				SkypeToken: "test-token",
				RegionGtms: {
					ams: "",
					drad: "",
					chatService: originalOrigin,
					middleTier: "",
					mtImageService: "",
					search: "",
					searchTelemetry: "",
					urlp: "",
					unifiedPresence: "",
					userProfileService: ""
				}
			});
		});

		afterEach(() => {
			jest.restoreAllMocks();
			jest.clearAllMocks();
		});

		it.each(["onEndpointCreationSuccess", "onSubscriptionCreationSuccess", "onRequestCreationFailureRedirect"] as const)(
			"%s retains the current endpoint and logs rejected locations", (callback) => {
				jest.spyOn(Utilities, "getResponseHeader").mockImplementation((_response, header) =>
					header === HttpHeaders.LocationHeader ? "https://outside.invalid/path/.microsoft.com/v1" : "");

				initializer[callback]({ status: HttpCode.Created });

				expect(initializer["ic3Info"].RegionGtms.chatService).toBe(originalOrigin);
				expect(logger.log).toHaveBeenCalled();
			});

		it.each(["onEndpointCreationSuccess", "onSubscriptionCreationSuccess", "onRequestCreationFailureRedirect"] as const)(
			"%s accepts a valid service origin", (callback) => {
				jest.spyOn(Utilities, "getResponseHeader").mockImplementation((_response, header) =>
					header === HttpHeaders.LocationHeader ? "https://next.microsoft.com/v1/endpoints/%7B123%7D" : "");

				initializer[callback]({ status: HttpCode.Created });

				expect(initializer["ic3Info"].RegionGtms.chatService).toBe("https://next.microsoft.com");
			});

		it("keeps the failure redirect retry budget bounded when a location is missing", () => {
			jest.spyOn(Utilities, "getResponseHeader").mockReturnValue("");
			initializer["onRequestCreationFailureRedirect"]({ status: HttpCode.Redirect });
			expect(initializer["ic3Info"].RegionGtms.chatService).toBe(originalOrigin);
			expect(initializer["current404RetryCount"]).toBe(1);
		});
	});
});
