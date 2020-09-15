export default class Constants {
    // Constants for IC3 Headers
    public static readonly NewMessageEvent = "NewMessage";
    public static readonly MessageUpdateEvent = "MessageUpdate";
    public static readonly ThreadUpdateEvent = "ThreadUpdate";
    public static readonly ConversationUpdateEvent = "ConversationUpdate";

    public static readonly HttpLongPoll = "HttpLongPoll";
    public static readonly ContentTypeJson = "application/json";
    public static readonly ContentTypeTextPlain = "text/plain;charset=UTF-8";
    public static readonly ContentTypeForm = "application/x-www-form-urlencoded";
    public static readonly RedirectAs404 = "redirectAs404";
    public static readonly NoCache = "no-cache";
    public static readonly User = "user";
    public static readonly Web = "web";
    public static readonly ClientInfoValue = "os=Windows; osVer=10; proc=Win32; lcid=en-us; deviceType=1; country=IN; clientName=swc; clientVer=912/0.106.0.34//swc";
    public static readonly TextPlainMimeType = "text/plain";
    public static readonly SwcName = "SWC";
    public static readonly Image = "image";
    public static readonly ClientVersion = "937/0.123.0.9";
    public static readonly DelayForAms = 50;

    public static readonly Reset_Flag = "reset_ic3_needed";

    // AMS File Status Constants
    public static readonly Malware = "malware";
    public static readonly Ready = "ready";
    public static readonly InProgress = "in progress";
    public static readonly Failed = "failed";
    public static readonly Expired = "expired";

    // AMS URL Constants - used to generate AMS URL's
    public static readonly ImageView = "imgpsh_fullsize_anim";
    public static readonly FileView = "original";
    public static readonly DocumentTypeImage = "pish/image";
    public static readonly DocumentTypeFile = "sharing/file";
    public static readonly ImageContent = "imgpsh";
    public static readonly FileContent = "original";

    // AMS Headers Constants
    public static readonly AMSAcceptHeaderValue = "image/webp,image/ *,*/*;q=0.8";
    public static readonly AMSAcceptEncodingHeaderValue = "gzip, deflate, sdch, br";
    public static readonly AMSAuthorizationSkypeTokenValue = "skype_token ";

    // Constants to stabilize new poll creation
    public static readonly stabilizePollMaxRetryCount = 50;
    public static readonly timeBetweenStabilizingPoll = 1000; // time in milliseconds (1 sec)

    // Constants for operation retries
    public static readonly retryCount = 2; // retry the same request within HttpClient
    public static readonly retry404Count = 3;
    public static readonly retryOtherCount = 3;
    public static readonly liveStateRetryCount = 3;
    public static readonly timeBetweenOperationRetry = 1000; // time in milliseconds (1 sec)
    public static readonly heartBeatDuration = 30000; // time in milliseconds (30 sec)

    // Log constants
    public static readonly endpointRequestLog = "Endpoint request";
    public static readonly subscriptionRequestLog = "Subscription request";
    public static readonly setPropertiesRequestLog = "Set message properties request";
    public static readonly unsubscribeRequestLog = "Unsubscribe from endpoint request";
    public static readonly pollRequestLog = "Polling";
    public static readonly oldInitializer = "Old initializer";
    public static readonly newInitializer = "New Initializer";

    // Constants for AMS URL to set the cookie
    public static readonly skypeTokenAuthURL = "/v1/skypetokenauth";
    public static readonly skypeTokenConstantForData = "skypetoken=";
}