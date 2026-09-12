The most complex technical challenge was designing the real-time role
filtered activity feed with zero unauthorized data leakage. Rather
than broadcasting events globally and filtering on the client , i
enforced authorization at the server level within the websocket
layer.Upon socket connection ,The server manages WebSocket connections
by putting users into different rooms based on their roles and what
they are allowed to access. For example, admins can have their own
room, project managers can join rooms for the projects they are
assigned to, and developers can receive updates through task-specific
channels.
Whenever a task status changes, the server first saves the update in
PostgreSQL and then sends the event only to the users who are
authorized to receive it. If a user disconnects and comes back later,
the server can fetch the updates they missed directly from the
database. These updates are retrieved using cursor-based pagination
and the same role-based permissions, instead of depending on temporary
in-memory data.
If the application needs to handle a much larger number of users, I
would move the WebSocket state management to Redis using a distributed
Pub/Sub adapter. I would also use BullMQ with Redis for background
jobs such as checking overdue tasks. This would make it easier to run
multiple Node.js servers at the same time while also providing better
job retries and reliability when the system is under heavy load.
