# Challenge-Based Learning Documentation — USOF Backend

For the frontend's own CBL documentation, see [`../../docs/CBL.md`](../../docs/CBL.md).

## Engage
During this stage I've skimmed through the task details, familiarized myself with requirements and decided on general order i will be developing the project in.
## Investigate
On this step I've completed guiding activities, which included exploring db features. One of the features that have caught my eye is PostgreSQL's materialized views, which can be used to cache heavy query's results to increase performance. Another one is text search using tsvector and GIN indexing which is featured in the same db. I wouldn't be able to use those features because the project is limited to MySql.
I've also contacted some students to ponder together on how exactly some of the requirements should be understood. And created a Trello board to track my progress.
## Act
During the acting stage i have changed my database schema several times. Either for better design or for project extension during creative stage. Since database recreation scripts were created it wasn't a big deal.
I started by defining base db model as well as several specific models and then worked my way from controller back to router. I've tried mixing it up and doing it out of order, which didn't help at all, and doing it backwards, starting from route definitions, which i liked.
In this stage i quite enjoyed writing middleware to remove repeated code from controllers. It feels good to have objects ready in your controller instead of having to check for edge cases constantly.
Error wise - i have created several error objects for standard web dev cases. And one standardized spatial error for validation of sent data, to give front clear feedback of what fields were missing or wrong.
In this project i used negative space programming technique, which boils down to make your program crash if you wrote your code wrong. I like this approach because it allows you to notice some of your mistakes earlier and removes a share of of debugging because it is clear where the error came from.
## Creative
* Rate limiting
* User ban system
* Post subscriptions & notifications
* Rating leader-board
* Improved role hierarchy
* Can ask to resend email verification code
