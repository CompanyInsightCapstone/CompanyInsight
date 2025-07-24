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
                    c.id, c.symbol, ce.vector
                FROM "Company" c
                INNER JOIN watchlist_companies_cte wc ON c.id = wc."companyId"
                LEFT JOIN "CompanyEmbeddings" ce ON ce."companyId" = c.id
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            column_names = [desc[0] for desc in cursor.description]
            companies = {}
            for row in rows:
                row_dict = {column_names[i]: value for i, value in enumerate(row)}
                company_id = row_dict.get("id")
                companies[company_id] = {
                    "id": company_id,
                    "symbol": row_dict.get("symbol"),
                    "vector": row_dict.get("vector"),
                }
            return list(companies.values())
