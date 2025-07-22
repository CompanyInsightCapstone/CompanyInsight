class User:

    database = None

    @classmethod
    def connect(cls, database):
        cls.database = database

    @classmethod
    def watchlist(cls, user_id):
        with cls.database.cursor() as cursor:
            cursor.execute(
                """
                WITH watchlist_companies_cte AS (
                    SELECT "companyId" FROM "Watchlist" WHERE "userId" = %s
                )
                SELECT
                    c.id, c.symbol, c.name, c.exchange, c."assetType", c."ipoDate", c."delistingDate", c.status,
                    cd.id as details_id, cd.description,
                    cn.id as numericals_id, cn."rawClose", cn.close, cn.open, cn.high, cn.low, cn.volume, cn."simpleMovingAverage"
                FROM "Company" c
                INNER JOIN watchlist_companies_cte wc ON c.id = wc."companyId"
                LEFT JOIN "CompanyDetails" cd ON cd."companyId" = c.id
                LEFT JOIN "CompanyNumericals" cn ON cn."companyId" = c.id
                """,
                (user_id,)
            )

            rows = cursor.fetchall()
            column_names = [desc[0] for desc in cursor.description]

            companies = {}
            for row in rows:
                row_dict = {column_names[i]: value for i, value in enumerate(row)}

                company_id = row_dict["id"]
                companies[company_id] = {
                    "id": company_id,
                    "symbol": row_dict["symbol"],
                    "name": row_dict["name"],
                    "exchange": row_dict.get("exchange"),
                    "assetType": row_dict.get("assetType"),
                    "ipoDate": row_dict.get("ipoDate"),
                    "delistingDate": row_dict.get("delistingDate", "N/A"),
                    "status": row_dict.get("status"),
                    "description": row_dict.get("description"),
                    "close": row_dict.get("close"),
                    "open": row_dict.get("open"),
                    "high": row_dict.get("high"),
                    "low": row_dict.get("low"),
                    "volume": row_dict.get("volume"),
                    "simpleMovingAverage": row_dict.get("simpleMovingAverage"),
                }

            return list(companies.values())
