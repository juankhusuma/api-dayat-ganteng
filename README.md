# API BUAT DAYAT GANTENG

endpoint
```
[POST] https://api-dayat-ganteng.vercel.app/api/query
```

Body Example (Ikutin Docs Notion API)
```json
{
    "filter": {
        "property": "material",
        "rich_text": { equals: "geometri_ruang" },
        "and": [
            {
                "property": "sub_material",
                "rich_text": { "equals": "jarak_antar_titik" }
            }
        ]
    }
}
```