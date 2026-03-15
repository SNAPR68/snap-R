/**
 * SnapR API v1 — OpenAPI 3.0 Specification
 * GET /api/v1/openapi.json — Returns the OpenAPI spec as JSON (public, no auth)
 */

import { NextResponse } from 'next/server'

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'SnapR API',
    version: '1.0.0',
    description:
      'AI-powered photo enhancement, video generation, and marketing automation for real estate. Integrate SnapR into your brokerage platform, MLS system, or custom application.',
    contact: {
      name: 'SnapR Developer Support',
      url: 'https://snap-r.com/developers',
      email: 'api@snap-r.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://snap-r.com',
      description: 'Production',
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  tags: [
    { name: 'Listings', description: 'Property listing CRUD and preparation' },
    { name: 'Photos', description: 'Photo retrieval and AI enhancement' },
    { name: 'Video', description: 'Video generation and render status' },
    { name: 'Leads', description: 'Lead management' },
    { name: 'Webhooks', description: 'Outgoing webhook configuration' },
  ],
  paths: {
    '/api/v1/listings': {
      get: {
        tags: ['Listings'],
        summary: 'List all listings',
        description: 'Returns a paginated list of listings for the authenticated user.',
        operationId: 'listListings',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/PerPage' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of listings',
            headers: {
              'X-RateLimit-Limit': { $ref: '#/components/headers/X-RateLimit-Limit' },
              'X-RateLimit-Remaining': { $ref: '#/components/headers/X-RateLimit-Remaining' },
              'X-RateLimit-Reset': { $ref: '#/components/headers/X-RateLimit-Reset' },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Listing' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
      post: {
        tags: ['Listings'],
        summary: 'Create a listing',
        description: 'Creates a new property listing.',
        operationId: 'createListing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ListingCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Listing created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Listing' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/api/v1/listings/{id}': {
      get: {
        tags: ['Listings'],
        summary: 'Get a listing',
        description: 'Returns listing details including photos.',
        operationId: 'getListing',
        parameters: [{ $ref: '#/components/parameters/ListingId' }],
        responses: {
          '200': {
            description: 'Listing details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Listing' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Listings'],
        summary: 'Update a listing',
        description: 'Updates listing fields. Only provided fields are changed.',
        operationId: 'updateListing',
        parameters: [{ $ref: '#/components/parameters/ListingId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ListingUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Listing updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Listing' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Listings'],
        summary: 'Delete a listing',
        description: 'Permanently deletes a listing and its associated data.',
        operationId: 'deleteListing',
        parameters: [{ $ref: '#/components/parameters/ListingId' }],
        responses: {
          '200': {
            description: 'Listing deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/listings/{id}/photos': {
      get: {
        tags: ['Photos'],
        summary: 'List photos for a listing',
        description: 'Returns all photos associated with a listing, including raw and processed URLs.',
        operationId: 'listListingPhotos',
        parameters: [{ $ref: '#/components/parameters/ListingId' }],
        responses: {
          '200': {
            description: 'List of photos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Photo' },
                    },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/listings/{id}/status': {
      get: {
        tags: ['Listings'],
        summary: 'Get listing status',
        description: 'Returns preparation and marketing pipeline status for a listing.',
        operationId: 'getListingStatus',
        parameters: [{ $ref: '#/components/parameters/ListingId' }],
        responses: {
          '200': {
            description: 'Listing status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/ListingStatus' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/listings/{id}/prepare': {
      post: {
        tags: ['Listings'],
        summary: 'Trigger AI preparation',
        description:
          'Starts the AI preparation pipeline for a listing. This includes photo analysis, enhancement decisions, and quality scoring. Returns immediately with a 202 status.',
        operationId: 'prepareListing',
        parameters: [{ $ref: '#/components/parameters/ListingId' }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  priority: {
                    type: 'string',
                    enum: ['normal', 'high'],
                    default: 'normal',
                    description: 'Processing priority',
                  },
                },
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Preparation started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        message: { type: 'string', example: 'Preparation started' },
                        listing_id: { type: 'string', format: 'uuid' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/photos/{id}/enhance': {
      post: {
        tags: ['Photos'],
        summary: 'Enhance a photo',
        description:
          'Applies an AI enhancement tool to a photo. Available tools: sky-replacement, virtual-twilight, lawn-repair, pool-enhance, declutter, virtual-staging, fire-fireplace, tv-screen, lights-on, window-masking, hdr, auto-enhance, perspective-correction, lens-correction, color-balance.',
        operationId: 'enhancePhoto',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Photo UUID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EnhanceRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Enhancement result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/EnhanceResult' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/video/generate': {
      post: {
        tags: ['Video'],
        summary: 'Generate a video',
        description:
          'Triggers a video render via Remotion Lambda. Returns a render_id for polling status. Templates: property-showcase, just-listed, open-house, price-drop, sold, short-form.',
        operationId: 'generateVideo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VideoGenerateRequest' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Video render started',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        render_id: { type: 'string' },
                        status: { type: 'string', example: 'rendering' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/video/{renderId}': {
      get: {
        tags: ['Video'],
        summary: 'Get video render status',
        description: 'Returns the current status and output URL of a video render job.',
        operationId: 'getVideoStatus',
        parameters: [
          {
            name: 'renderId',
            in: 'path',
            required: true,
            description: 'Render job ID returned from the generate endpoint',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Render status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/VideoRenderStatus' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/leads': {
      get: {
        tags: ['Leads'],
        summary: 'List leads',
        description: 'Returns a paginated list of leads. Optionally filter by listing_id.',
        operationId: 'listLeads',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/PerPage' },
          {
            name: 'listing_id',
            in: 'query',
            description: 'Filter leads by listing UUID',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of leads',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Lead' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
      post: {
        tags: ['Leads'],
        summary: 'Create a lead',
        description: 'Creates a new lead record. Optionally associate with a listing.',
        operationId: 'createLead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LeadCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Lead created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Lead' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks',
        description: 'Returns all configured outgoing webhooks.',
        operationId: 'listWebhooks',
        responses: {
          '200': {
            description: 'List of webhooks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Webhook' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Create a webhook',
        description: 'Registers a new outgoing webhook endpoint. Payloads are signed with HMAC-SHA256.',
        operationId: 'createWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Webhook created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Webhook' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Webhooks'],
        summary: 'Update a webhook',
        description: 'Updates an existing webhook configuration.',
        operationId: 'updateWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Webhook' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Webhooks'],
        summary: 'Delete a webhook',
        description: 'Removes a webhook endpoint. Pending deliveries are not retried.',
        operationId: 'deleteWebhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', format: 'uuid', description: 'Webhook UUID' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API key from Dashboard Settings. Keys start with `sk_live_`.',
      },
    },
    parameters: {
      Page: {
        name: 'page',
        in: 'query',
        description: 'Page number (1-based)',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      PerPage: {
        name: 'per_page',
        in: 'query',
        description: 'Items per page (max 100)',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
      },
      ListingId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Listing UUID',
        schema: { type: 'string', format: 'uuid' },
      },
    },
    headers: {
      'X-RateLimit-Limit': {
        description: 'Maximum requests per window',
        schema: { type: 'integer', example: 60 },
      },
      'X-RateLimit-Remaining': {
        description: 'Remaining requests in current window',
        schema: { type: 'integer', example: 55 },
      },
      'X-RateLimit-Reset': {
        description: 'Unix timestamp when the rate limit window resets',
        schema: { type: 'integer', example: 1710500000 },
      },
    },
    schemas: {
      Listing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Stunning Modern Estate' },
          address: { type: 'string', example: '123 Main St' },
          city: { type: 'string', example: 'Austin' },
          state: { type: 'string', example: 'TX' },
          postal_code: { type: 'string', example: '78701' },
          description: { type: 'string' },
          status: { type: 'string', example: 'active' },
          preparation_status: {
            type: 'string',
            enum: ['pending', 'processing', 'prepared', 'failed'],
          },
          marketing_status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
          },
          photo_count: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ListingCreate: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 200 },
          address: { type: 'string', maxLength: 300 },
          city: { type: 'string', maxLength: 100 },
          state: { type: 'string', maxLength: 50 },
          postal_code: { type: 'string', maxLength: 20 },
          description: { type: 'string', maxLength: 10000 },
        },
      },
      ListingUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 200 },
          address: { type: 'string', maxLength: 300 },
          city: { type: 'string', maxLength: 100 },
          state: { type: 'string', maxLength: 50 },
          postal_code: { type: 'string', maxLength: 20 },
          description: { type: 'string', maxLength: 10000 },
          status: { type: 'string', maxLength: 50 },
        },
      },
      ListingStatus: {
        type: 'object',
        properties: {
          listing_id: { type: 'string', format: 'uuid' },
          preparation_status: {
            type: 'string',
            enum: ['pending', 'processing', 'prepared', 'failed'],
          },
          marketing_status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
          },
          preparation_metadata: {
            type: 'object',
            description: 'Detailed preparation results including photoAudit and decisionAudit',
          },
          marketing_job: {
            type: 'object',
            description: 'Marketing pipeline per-step status and results',
            properties: {
              description_status: { type: 'string' },
              captions_status: { type: 'string' },
              mls_status: { type: 'string' },
              property_site_status: { type: 'string' },
              scheduled_posts_status: { type: 'string' },
            },
          },
        },
      },
      Photo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          listing_id: { type: 'string', format: 'uuid' },
          raw_url: { type: 'string', format: 'uri' },
          processed_url: { type: 'string', format: 'uri', nullable: true },
          variant: { type: 'string', nullable: true },
          confidence: { type: 'number', nullable: true },
          tools_applied: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
          },
          sort_order: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      EnhanceRequest: {
        type: 'object',
        required: ['toolId'],
        properties: {
          toolId: {
            type: 'string',
            description: 'Enhancement tool ID',
            enum: [
              'sky-replacement',
              'virtual-twilight',
              'lawn-repair',
              'pool-enhance',
              'declutter',
              'virtual-staging',
              'fire-fireplace',
              'tv-screen',
              'lights-on',
              'window-masking',
              'hdr',
              'auto-enhance',
              'perspective-correction',
              'lens-correction',
              'color-balance',
            ],
          },
          preset: {
            type: 'string',
            description: 'Tool preset (e.g., "Clear Blue" for sky-replacement)',
            maxLength: 100,
          },
          listingId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated listing UUID',
          },
        },
      },
      EnhanceResult: {
        type: 'object',
        properties: {
          processed_url: { type: 'string', format: 'uri' },
          tool_applied: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
      VideoGenerateRequest: {
        type: 'object',
        required: ['listingId', 'aspectRatio', 'template'],
        properties: {
          listingId: { type: 'string', format: 'uuid' },
          aspectRatio: {
            type: 'string',
            enum: ['9:16', '1:1', '16:9'],
            description: 'Video aspect ratio',
          },
          template: {
            type: 'string',
            enum: ['property-showcase', 'just-listed', 'open-house', 'price-drop', 'sold', 'short-form'],
            description: 'Video template',
          },
          openHouseDate: { type: 'string', description: 'Date string for open-house template' },
          previousPrice: { type: 'number', description: 'Previous price for price-drop template' },
          daysOnMarket: { type: 'integer', description: 'Days on market counter' },
          audio: {
            type: 'object',
            properties: {
              musicTrack: { type: 'string' },
              musicVolume: { type: 'number', minimum: 0, maximum: 100 },
              voiceoverUrl: { type: 'string', format: 'uri' },
              voiceoverVolume: { type: 'number', minimum: 0, maximum: 100 },
            },
          },
        },
      },
      VideoRenderStatus: {
        type: 'object',
        properties: {
          render_id: { type: 'string' },
          status: {
            type: 'string',
            enum: ['rendering', 'completed', 'failed'],
          },
          output_url: { type: 'string', format: 'uri', nullable: true },
          error: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          message: { type: 'string', nullable: true },
          listing_id: { type: 'string', format: 'uuid', nullable: true },
          score: { type: 'integer', minimum: 0, maximum: 100 },
          status: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'touring', 'offer', 'closed', 'lost'],
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      LeadCreate: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', maxLength: 30 },
          message: { type: 'string', maxLength: 2000 },
          listing_id: { type: 'string', format: 'uuid' },
          source: { type: 'string', maxLength: 100, description: 'Lead source (defaults to "api")' },
        },
      },
      Webhook: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          url: { type: 'string', format: 'uri' },
          events: {
            type: 'array',
            items: { $ref: '#/components/schemas/WebhookEvent' },
          },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      WebhookCreate: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: { type: 'string', format: 'uri', maxLength: 2000 },
          events: {
            type: 'array',
            items: { $ref: '#/components/schemas/WebhookEvent' },
            minItems: 1,
          },
          secret: {
            type: 'string',
            maxLength: 500,
            description: 'Shared secret for HMAC-SHA256 signature verification',
          },
        },
      },
      WebhookUpdate: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          url: { type: 'string', format: 'uri', maxLength: 2000 },
          events: {
            type: 'array',
            items: { $ref: '#/components/schemas/WebhookEvent' },
            minItems: 1,
          },
          is_active: { type: 'boolean' },
          secret: { type: 'string', maxLength: 500 },
        },
      },
      WebhookEvent: {
        type: 'string',
        enum: [
          'listing.created',
          'listing.prepared',
          'listing.marketing_complete',
          'lead.created',
          'lead.status_changed',
          'post.published',
          'post.scheduled',
          'open_house.checkin',
        ],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          per_page: { type: 'integer', example: 50 },
          total: { type: 'integer', example: 123 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            required: ['message', 'code'],
            properties: {
              message: { type: 'string', example: 'Resource not found' },
              code: {
                type: 'string',
                enum: ['validation_error', 'not_found', 'unauthorized', 'rate_limited', 'internal_error'],
              },
              details: {
                type: 'object',
                description: 'Field-level validation errors (when code is validation_error)',
              },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid API key',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: { message: 'Invalid API key', code: 'unauthorized' },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: { message: 'Resource not found', code: 'not_found' },
            },
          },
        },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: {
                message: 'Invalid request body',
                code: 'validation_error',
                details: { fieldErrors: { title: ['Required'] } },
              },
            },
          },
        },
      },
      RateLimited: {
        description: 'Rate limit exceeded',
        headers: {
          'Retry-After': {
            description: 'Seconds to wait before retrying',
            schema: { type: 'integer' },
          },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              error: { message: 'Rate limit exceeded', code: 'rate_limited' },
            },
          },
        },
      },
    },
  },
} as const

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
