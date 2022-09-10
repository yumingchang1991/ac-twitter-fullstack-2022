## Project Name
Alphitter socket.io Challenge

## Description
This is an extended challenges from Alphitter to implement **socket.io**

This version is not deployed to cloud services, but could be run locally.

## Developer
This branch is developed solely by [Yu-Ming](https://www.linkedin.com/in/yumingchang1991/)

## Core Technologies
- `socket.io` for real-time chat
- the rest of tech stacks are the same as listed in [master branch](https://github.com/yumingchang1991/ac-twitter-fullstack-2022)

## What I Developed
| Features | Description |
| --- | --- |
| Real-time Chat | Implement **event-based `socket.io` application** between client-side and server-side |
| Direct SQL | Use **direct SQL query** to get & format data from MySQL |
| Security | Wrap **direct SQL query** to avoid **SQL Injection Attack** |
| Readibility | Use **async/await functions** to manage asychronous actions |
| Middlewares | Implement **middlewares** in both HTTP server & Socket.io server to get essential data |
| Service Worker | Abstract actions not directly related to Express Server to **service**, for example, qery data from database |
| Seeder | Write **private-messages-seeder** to facilitate development |

## Steps to start this project locally

### 1) Clone a local copy of this repo
```bash
git clone https://github.com/yumingchang1991/ac-twitter-fullstack-2022
```


### 2) Change directory to local repo and install dependencies
```bash
npm install
```

### 3) Add a file named '.env' and fill in the required constant according to '.env.example'
```bash
touch .env
```  
    
&nbsp;&nbsp;_If you don't have client id and secret for imgur, you can apply [here](https://api.imgur.com/oauth2/addclient)_


### 4) Create database connection and database according to the following
- connection:

|parameter|value|
|---------|---------|
|hostname|127.0.0.1|
|username|root|
|password|password|

- database:

|environment|database|
|:---------:|:------------------:|
|development|ac_twitter_workspace|
|test|ac_twitter_workspace_test|

### 5) Create required table in database
```bash
npx sequelize db:migrate
```

### 6) Create seeds in database
```bash
npx sequelize db:seed:all
```

### 7) start the server
```bash
npm run dev
```

### 8) Open browser and navigate to https://localhost:3000
&nbsp;&nbsp;_You can use the following accounts to login_
|role|account|password|
|:-----:|:-------:|:--------:|
|admin|root|12345678|
|user|user1|12345678|

### 9) Enjoy!
