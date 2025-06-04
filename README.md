
## authenticate the user
{
    type: "authenticate",
    token: "your-jwt-token"
}

// Success Response
{
    message: "phone_number authenticated successfully"
}

// Error Response
{
    error: "Token is required to authenticate" | "Token is Invalid!"
}




## subscribe to a group Request
{
    type: "subscribe",
    groupId: "group-uuid"
}

# Success Response
{
    type: "pastMessages",
    isStreaming: boolean,
    pinnedMessage: {
        id: string,
        message: string,
        // ... other message properties
    },
    message: Message[]
}

# Error Response
{
    error: "groupId is required to subscribe"
}

## send message Request
{
    type: "message",
    groupId: "group-uuid",
    message: "message content"
}

// Broadcast Response
{
    type: "message",
    groupId: "group-uuid",
    message: "message content"
}

## Delete Single Message
{
    type: "deleteMessage",
    messageId: "message-uuid"
}

## Delete Multiple Messages
{
    type: "multipleDeleteMessages",
    messageIds: ["message-uuid-1", "message-uuid-2"]
}

## Clear All Messages
{
    type: "clearMessagesFromChannel",
    groupId: "group-uuid"
}


## Pin/Unpin Message
{
    type: "pinMessage",
    messageId: "message-uuid",
    isPinned: boolean
}

## Edit Message
{
    type: "editMessage",
    messageId: "message-uuid",
    groupId: "group-uuid",
    updateText: "updated message content"
}

## streaming in a group Request
{
    type: "streaming",
    groupId: "group-uuid",
    isStreaming: boolean
}