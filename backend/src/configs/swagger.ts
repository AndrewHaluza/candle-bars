import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Weather Candle Bars API",
    version: "1.0.0",
    description: "API for weather data aggregation and candle bar generation",
    contact: {
      name: "API Support",
      email: "support@weathercandlebars.com",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Error message",
          },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
        },
      },
      CandleBarData: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: {
                  type: "string",
                  format: "date-time",
                  example: "2024-01-01T00:00:00.000Z",
                },
                open: {
                  type: "number",
                  example: 20.5,
                },
                high: {
                  type: "number",
                  example: 25.3,
                },
                low: {
                  type: "number",
                  example: 18.2,
                },
                close: {
                  type: "number",
                  example: 23.1,
                },
                city: {
                  type: "string",
                  example: "NewYork",
                },
              },
            },
          },
        },
      },
      SchedulerStatus: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            properties: {
              isRunning: {
                type: "boolean",
                example: true,
              },
              lastRun: {
                type: "string",
                format: "date-time",
                example: "2024-01-01T12:00:00.000Z",
              },
              nextRun: {
                type: "string",
                format: "date-time",
                example: "2024-01-01T13:00:00.000Z",
              },
            },
          },
        },
      },
      AggregationRequest: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            example: "2025-06-29T13:48:43.184Z",
            description: "Start date for aggregation (2025-06-29T13:48:43.184Z)",
          },
          endDate: {
            type: "string",
            format: "date",
            example: "2024-01-31",
            description: "End date for aggregation (2025-06-29T13:48:43.184Z)",
          },
        },
      },
    },
    parameters: {
      CityParam: {
        name: "city",
        in: "path",
        required: true,
        schema: {
          type: "string",
          example: "NewYork",
        },
        description: "Name of the city",
      },
      CityQuery: {
        name: "city",
        in: "query",
        required: true,
        schema: {
          type: "string",
          example: "NewYork",
        },
        description: "Name of the city",
      },
      StartDateQuery: {
        name: "startDate",
        in: "query",
        required: false,
        schema: {
          type: "string",
          format: "date",
          example: "2025-06-29T13:48:43.184Z",
        },
        description: "Start date for data retrieval (2025-06-29T13:48:43.184Z). Defaults to 6 months ago if not provided.",
      },
      EndDateQuery: {
        name: "endDate",
        in: "query",
        required: false,
        schema: {
          type: "string",
          format: "date",
          example: "2025-06-29T15:48:43.184Z",
        },
        description: "End date for data retrieval (2025-06-29T13:48:43.184Z). Defaults to today if not provided.",
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [
    "./src/routes/api/v1/*.ts", // Path to the API routes
    "./src/routes/*.ts", // Additional route files
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
