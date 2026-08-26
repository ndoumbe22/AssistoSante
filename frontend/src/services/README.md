# AssitoSanté Services

This directory contains service files for interacting with the backend API.

## New Services (Phase 4)

### Notification Service

- `notificationService.js` - Service for managing user notifications

### Push Notification Service

- `pushNotificationService.js` - Service for handling browser push notifications

## Usage

### Notification Service

```javascript
import notificationService from "../services/notificationService";

// Get all notifications
const notifications = await notificationService.getNotifications();

// Mark a notification as read
await notificationService.markAsRead(notificationId);

// Delete a notification
await notificationService.deleteNotification(notificationId);
```

### Push Notification Service

```javascript
import pushNotificationService from "../services/pushNotificationService";

// Request permission for push notifications
const hasPermission = await pushNotificationService.requestPermission();

// Check if push notifications are enabled
const isEnabled = pushNotificationService.isPushEnabled();

// Show a notification
pushNotificationService.showNotification("Title", {
  body: "Notification body",
  icon: "/images/logo.png",
});
```

## Service Worker

The service worker (`sw.js`) handles push notifications in the background. It should be registered in your main application file.

## Environment Variables

The push notification service requires the following environment variable:

- `REACT_APP_VAPID_PUBLIC_KEY` - VAPID public key for push notifications

## Implementation Notes

1. Push notifications require HTTPS in production
2. Users must grant permission for notifications
3. Service workers must be registered for push notifications to work
4. The VAPID keys must be configured on both frontend and backend
