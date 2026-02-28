export const swaggerDefinition = {
    openapi: '3.0.1',
    info: {
        version: '1.0.0',
        title: 'COART Gateway Documentation',
        description: 'This is a documentation of Symbol blockchain gateway dedicated to COART project. It contains description and structure of the endpoints'
    },
    servers: [
        {
            url: "http://localhost:4000/api"
        }
    ]
}