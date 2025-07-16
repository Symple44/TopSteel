export const imageElasticsearchMapping = {
  "mappings": {
    "properties": {
      "id": {
        "type": "keyword"
      },
      "fileName": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {
            "type": "keyword"
          },
          "suggest": {
            "type": "completion"
          }
        }
      },
      "originalName": {
        "type": "text",
        "analyzer": "filename_analyzer",
        "fields": {
          "keyword": {
            "type": "keyword"
          },
          "suggest": {
            "type": "completion"
          }
        }
      },
      "mimeType": {
        "type": "keyword"
      },
      "size": {
        "type": "long"
      },
      "dimensions": {
        "properties": {
          "width": {
            "type": "integer"
          },
          "height": {
            "type": "integer"
          }
        }
      },
      "hash": {
        "type": "keyword"
      },
      "category": {
        "type": "keyword"
      },
      "uploadedBy": {
        "type": "keyword"
      },
      "uploadedAt": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },
      "tags": {
        "type": "keyword",
        "fields": {
          "suggest": {
            "type": "completion"
          }
        }
      },
      "alt": {
        "type": "text",
        "analyzer": "standard"
      },
      "description": {
        "type": "text",
        "analyzer": "standard"
      },
      "entity": {
        "properties": {
          "type": {
            "type": "keyword"
          },
          "id": {
            "type": "keyword"
          }
        }
      },
      "variants": {
        "type": "nested",
        "properties": {
          "variant": {
            "type": "keyword"
          },
          "fileName": {
            "type": "keyword"
          },
          "dimensions": {
            "properties": {
              "width": {
                "type": "integer"
              },
              "height": {
                "type": "integer"
              }
            }
          },
          "size": {
            "type": "long"
          },
          "url": {
            "type": "keyword",
            "index": false
          }
        }
      },
      "searchText": {
        "type": "text",
        "analyzer": "standard"
      },
      "suggest": {
        "type": "completion",
        "analyzer": "simple",
        "contexts": [
          {
            "name": "category",
            "type": "category"
          }
        ]
      }
    }
  },
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "filename_analyzer": {
          "tokenizer": "keyword",
          "filter": ["lowercase", "filename_ngram"]
        }
      },
      "filter": {
        "filename_ngram": {
          "type": "ngram",
          "min_gram": 2,
          "max_gram": 20
        }
      }
    }
  }
}