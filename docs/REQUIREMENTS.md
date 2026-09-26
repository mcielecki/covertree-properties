# Requirements (Covertree recruitment task)

## Objective
Build the full stack application that allows management of records of properties, as GraphQL API.
During the creation of the property, API call shall be made to Weatherstack API
(endpoint: https://api.weatherstack.com/current) in order to grab current weather for the location
of the property. The task shall be completed mostly with AI-first workflows.

## User stories
1. As a user I can query all the properties.
2. As a user I am able to sort the properties by date of creation.
3. As a user, I'm able to filter the properties list by their city, zip code and state, where they are located.
4. As a user, I can query details of any property.
5. As a user, I can add a new property (assumption - all properties are within the United States).
6. As a user, I can delete any property.
7. Property properties should include:
   - id (whatever format you prefer - created automatically during creation on the Backend/Database side)
   - city (passed via GraphQL mutation argument on creation, ex: Fountain Hills)
   - street (passed via GraphQL mutation argument on creation, containing both street and property number - ex: 15528 E Golden Eagle Blvd)
   - state (passed via GraphQL mutation argument on creation, abbreviation, ex: AZ)
   - zipCode (passed via GraphQL mutation argument on creation, 5 digit one, ex: 85268)
   - weatherData (object containing "current" property from Weatherstack API call - the third party API call shall be made during Mutation call, which creates new property)
   - lat (latitude, from the API response - the third party API call shall be made during Mutation call, which creates new property, ex: 33.609)
   - long (longitude, from the API response - the third party API call shall be made during Mutation call, which creates new property, ex: -111.729)

## Notes
- This should produce a running application. Include a README with instructions on how to run the application.
- Call the third party API only during creation of the property (as part of the GraphQL Mutation).
- Backend: TypeScript/Node JS. Frontend: React/TypeScript.
- Any database is fine.
- Use the stack you can be most efficient and elegant with.
- Include the full AI setup used (skills, prompts, agents, MCP servers or others).
- Tip: https://zillow.com can be used as a database of addresses for testing.

## Assessment criteria
- Code smells, usage of design patterns, coding standards and best practices, complexity of various kinds.
- Right selection of right technologies/libraries.
- Completion of the scope.
- Quality of the AI harness and prompts used for the assessment.

## Delivery
1. Public GitHub/GitLab repo with the codebase, including shared AI sessions (prompts and progress).
2. Code walkthrough session when scheduled.