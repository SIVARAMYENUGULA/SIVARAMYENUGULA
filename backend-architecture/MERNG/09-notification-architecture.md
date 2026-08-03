# Notification Architecture

## Types: info, success, warning, error

## Triggers
- Application submitted -> Company (info)
- Status changed -> Student (varies)
- Assessment available -> Student (info)
- Assessment completed -> Student (success)
- Profile incomplete -> Student (warning)

## Schema
- userId, title, message, type (enum), isRead (default false), link, metadata (Mixed)
- Indexes: {userId:1, isRead:1}, {createdAt:-1}

## API
- GET / -> List + unreadCount
- PUT /:id/read -> Mark one as read
- PUT /read-all -> Mark all as read