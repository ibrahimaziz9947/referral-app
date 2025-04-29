# Referral App with Task Management

A full-stack application that allows users to earn rewards through referrals and completing tasks. The system includes user authentication, wallet management, and task completion workflows.

## Features

- User authentication (signup, login, password reset)
- Admin and regular user roles
- Wallet management with recharge requests
- Task creation and management by admins
- Task submission and approval workflow
- Automatic wallet updates upon task approval

## API Documentation

### Authentication Endpoints

#### Register a New User
```
POST /api/auth/signup
```
**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneContact": "1234567890",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "passkey": "passkey123",
  "isAdmin": false  // Optional, defaults to false
}
```
**Response:**
```json
{
  "message": "User registered successfully",
  "yourReferralCode": "abc123",
  "token": "jwt_token_here",
  "isAdmin": false
}
```

#### Login
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "message": "Login successful",
  "referralCode": "abc123",
  "token": "jwt_token_here"
}
```

#### Reset Password
```
POST /api/auth/reset-password
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "passkey": "passkey123",
  "newPassword": "newpassword123"
}
```
**Response:**
```json
{
  "message": "Password reset successful"
}
```

### Task Management Endpoints

#### Create a Task (Admin Only)
```
POST /api/tasks
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task Description",
  "image": "https://example.com/image.jpg",
  "reward": 100
}
```
**Response:**
```json
{
  "title": "Task Title",
  "description": "Task Description",
  "image": "https://example.com/image.jpg",
  "reward": 100,
  "status": "active",
  "createdBy": "user_id",
  "_id": "task_id",
  "createdAt": "2023-04-29T07:38:40.193Z"
}
```

#### Get All Tasks
```
GET /api/tasks
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
[
  {
    "title": "Task Title",
    "description": "Task Description",
    "image": "https://example.com/image.jpg",
    "reward": 100,
    "status": "active",
    "createdBy": {
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "_id": "task_id",
    "createdAt": "2023-04-29T07:38:40.193Z"
  }
]
```

#### Update a Task (Admin Only)
```
PUT /api/tasks/:id
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "image": "https://example.com/updated-image.jpg",
  "reward": 150,
  "status": "inactive"
}
```
**Response:**
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "image": "https://example.com/updated-image.jpg",
  "reward": 150,
  "status": "inactive",
  "createdBy": "user_id",
  "_id": "task_id",
  "createdAt": "2023-04-29T07:38:40.193Z"
}
```

#### Delete a Task (Admin Only)
```
DELETE /api/tasks/:id
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

#### Submit Task Completion
```
POST /api/tasks/submit
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "taskId": "task_id",
  "submissionDetails": "I have completed the task by..."
}
```
**Response:**
```json
{
  "task": "task_id",
  "user": "user_id",
  "submissionDetails": "I have completed the task by...",
  "status": "pending",
  "_id": "submission_id",
  "createdAt": "2023-04-29T07:38:51.011Z"
}
```

#### Get User's Task Submissions
```
GET /api/tasks/my-submissions
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
[
  {
    "task": {
      "title": "Task Title",
      "description": "Task Description",
      "image": "https://example.com/image.jpg",
      "reward": 100,
      "status": "active",
      "createdBy": "admin_id",
      "_id": "task_id",
      "createdAt": "2023-04-29T07:38:40.193Z"
    },
    "submissionDetails": "I have completed the task by...",
    "status": "approved",
    "createdAt": "2023-04-29T07:38:51.011Z",
    "reviewedAt": "2023-04-29T07:39:03.166Z"
  }
]
```

#### Get All Task Submissions (Admin Only)
```
GET /api/tasks/submissions
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
[
  {
    "task": {
      "title": "Task Title",
      "description": "Task Description",
      "image": "https://example.com/image.jpg",
      "reward": 100,
      "status": "active",
      "createdBy": "admin_id",
      "_id": "task_id",
      "createdAt": "2023-04-29T07:38:40.193Z"
    },
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "submissionDetails": "I have completed the task by...",
    "status": "approved",
    "createdAt": "2023-04-29T07:38:51.011Z",
    "reviewedBy": {
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "reviewedAt": "2023-04-29T07:39:03.166Z"
  }
]
```

#### Review Task Submission (Admin Only)
```
PUT /api/tasks/submissions/:id/review
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "status": "approved"  // or "rejected"
}
```
**Response:**
```json
{
  "task": {
    "title": "Task Title",
    "description": "Task Description",
    "image": "https://example.com/image.jpg",
    "reward": 100,
    "status": "active",
    "createdBy": "admin_id",
    "_id": "task_id",
    "createdAt": "2023-04-29T07:38:40.193Z"
  },
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "wallet": 100
  },
  "submissionDetails": "I have completed the task by...",
  "status": "approved",
  "createdAt": "2023-04-29T07:38:51.011Z",
  "reviewedBy": "admin_id",
  "reviewedAt": "2023-04-29T07:39:03.166Z"
}
```

### Wallet Management Endpoints

#### Get Wallet Balance
```
GET /api/wallet/balance
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "balance": 100
}
```

#### Request Wallet Recharge
```
POST /api/wallet/recharge
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "amount": 500,
  "proof": "https://example.com/payment-proof.jpg"
}
```
**Response:**
```json
{
  "message": "Recharge request submitted successfully"
}
```

#### Get All Recharge Requests (Admin Only)
```
GET /api/wallet/admin/recharge-requests
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
[
  {
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "amount": 500,
    "proof": "https://example.com/payment-proof.jpg",
    "status": "pending",
    "createdAt": "2023-04-29T07:38:51.011Z"
  }
]
```

#### Review Recharge Request (Admin Only)
```
POST /api/wallet/admin/review-recharge/:requestId
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "status": "approved"  // or "rejected"
}
```
**Response:**
```json
{
  "message": "Recharge request approved",
  "user": {
    "_id": "user_id",
    "wallet": 600
  }
}
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation

## Features

- User authentication with JWT
- Role-based access control (Admin/User)
- Task management system
- Wallet management with recharge requests
- Automatic wallet updates
- Referral system

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based middleware protection
- Secure password reset with passkey
