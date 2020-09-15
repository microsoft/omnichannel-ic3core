enum IC3TelemetryEvent {
    JoinConversation = "JoinConversation",
    RegisterOnNewMessage = "RegisterOnNewMessage",
    RegisterOnThreadUpdate = "RegisterOnThreadUpdate",
    OnNewMessageFailure = "OnNewMessageFailure",
    OnThreadUpdateFailure = "OnThreadUpdateFailure",
    SendLiveStateFailure = "SendLiveStateFailure",
    JoinConversationV1GetThreadRequestFailed = "JoinConversationV1GetThreadRequestFailed",
    UpdateToken = "UpdateToken",
    SyncingPollData = "SyncingPollData",
    IC3InitializationBegins = "IC3InitializationBegins",
    IC3StartedPolling = "IC3StartedPolling",
    IC3StoppedPolling = "IC3StoppedPolling",
    IC3EndpointCreationSuccess = "IC3EndpointCreationSuccess",
    RedirectOnRequestCreationFailure = "RedirectOnRequestCreationFailure",
    ResetOnRequestCreationFailure = "ResetOnRequestCreationFailure",
    MaxRetryCountReachedForRedirect = "MaxRetryCountReachedForRedirect",
    OnRequestCreationFailureRedirect = "OnRequestCreationFailureRedirect",
    OnRequestCreationSuccessRedirect = "OnRequestCreationSuccessRedirect",
    ErrorDuringPolling = "ErrorDuringPolling",
    HTTPRequestFailed = "HTTPRequestFailed",
    HTTPRequestUnusualResponse = "HTTPRequestUnusualResponse"
}

export default IC3TelemetryEvent;