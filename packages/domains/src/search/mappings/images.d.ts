export declare const imageElasticsearchMapping: {
  mappings: {
    properties: {
      id: {
        type: string
      }
      fileName: {
        type: string
        analyzer: string
        fields: {
          keyword: {
            type: string
          }
          suggest: {
            type: string
          }
        }
      }
      originalName: {
        type: string
        analyzer: string
        fields: {
          keyword: {
            type: string
          }
          suggest: {
            type: string
          }
        }
      }
      mimeType: {
        type: string
      }
      size: {
        type: string
      }
      dimensions: {
        properties: {
          width: {
            type: string
          }
          height: {
            type: string
          }
        }
      }
      hash: {
        type: string
      }
      category: {
        type: string
      }
      uploadedBy: {
        type: string
      }
      uploadedAt: {
        type: string
        format: string
      }
      tags: {
        type: string
        fields: {
          suggest: {
            type: string
          }
        }
      }
      alt: {
        type: string
        analyzer: string
      }
      description: {
        type: string
        analyzer: string
      }
      entity: {
        properties: {
          type: {
            type: string
          }
          id: {
            type: string
          }
        }
      }
      variants: {
        type: string
        properties: {
          variant: {
            type: string
          }
          fileName: {
            type: string
          }
          dimensions: {
            properties: {
              width: {
                type: string
              }
              height: {
                type: string
              }
            }
          }
          size: {
            type: string
          }
          url: {
            type: string
            index: boolean
          }
        }
      }
      searchText: {
        type: string
        analyzer: string
      }
      suggest: {
        type: string
        analyzer: string
        contexts: {
          name: string
          type: string
        }[]
      }
    }
  }
  settings: {
    number_of_shards: number
    number_of_replicas: number
    analysis: {
      analyzer: {
        filename_analyzer: {
          tokenizer: string
          filter: string[]
        }
      }
      filter: {
        filename_ngram: {
          type: string
          min_gram: number
          max_gram: number
        }
      }
    }
  }
}
//# sourceMappingURL=images.d.ts.map
