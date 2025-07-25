class Company:

    database = None

    @classmethod
    def connect(cls, database):
        cls.database = database

    @staticmethod
    def write_company_document_dict(cursor):
        """
        Format database results into a structured company dictionary for UI compatibility.

        Args:
            cursor: Database cursor with executed query

        Returns:
            List of formatted company dictionaries
        """
        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        companies = {}

        for row in rows:
            row_dict = {column_names[i]: value for i, value in enumerate(row)}
            company_id = row_dict["id"]
            score = row_dict.get("cosine_similarity")
            company_data = {
                "id": company_id,
                "symbol": row_dict["symbol"],
                "name": row_dict["name"],
                "exchange": row_dict.get("exchange"),
                "assetType": row_dict.get("assetType"),
                "ipoDate": row_dict.get("ipoDate"),
                "delistingDate": row_dict.get("delistingDate", "N/A"),
                "status": row_dict.get("status"),
                "CompanyDetails": {
                    "description": row_dict.get("description"),
                },
                "CompanyNumericals": [
                    {
                        "lastUpdated": row_dict.get("lastUpdated"),
                        "close": row_dict.get("close"),
                        "open": row_dict.get("open"),
                        "high": row_dict.get("high"),
                        "low": row_dict.get("low"),
                        "volume": row_dict.get("volume"),
                        "simpleMovingAverage": row_dict.get("simpleMovingAverage"),
                    }
                ],
            }

            if score is not None:
                company_data["score"] = score

            companies[company_id] = company_data

        return list(companies.values())

    @classmethod
    def query_nearest_neighbors(cls, query_vector, limit=20):
        """
        Find the nearest neighbors to the query vector using pgvector.

        Args:
            query_vector: The query vector to find nearest neighbors for
            k: The maximum number of results to return

        Returns:
            A dictionary containing the results and count
        """

        if hasattr(query_vector, "tolist"):
            query_vector = query_vector.tolist()

        with cls.database.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    c.id, c.symbol, c.name, c.exchange, c."assetType", c."ipoDate", c."delistingDate", c.status,
                    cd.id as details_id, cd.description,
                    cn.id as numericals_id, cn."lastUpdated" as lastUpdated, cn."rawClose", cn.close, cn.open, cn.high, cn.low, cn.volume, cn."simpleMovingAverage",
                    ((ce."vector" <#> %s::vector) * -1) AS cosine_similarity
                FROM "Company" c
                JOIN "CompanyEmbeddings" ce ON c.id = ce."companyId"
                LEFT JOIN "CompanyDetails" cd ON cd."companyId" = c.id
                LEFT JOIN "CompanyNumericals" cn ON cn."companyId" = c.id
                ORDER BY cosine_similarity DESC
                LIMIT %s
                """,
                (query_vector, limit),
            )

            results = cls.write_company_document_dict(cursor)
            return results

    @classmethod
    def company_nearest_neighbors(cls, company_vector, limit=1):
        """
        Find the nearest neighbors to the company vector using pgvector.

        Args:
            company_vector: The query vector to find nearest neighbors for
            k: The maximum number of results to return

        Returns:
            A dictionary containing the results and count
        """

        if hasattr(company_vector, "tolist"):
            company_vector = company_vector.tolist()

        with cls.database.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    c.id, c.symbol, c.name, c.exchange, c."assetType", c."ipoDate", c."delistingDate", c.status,
                    cd.id as details_id, cd.description,
                    cn.id as numericals_id, cn."lastUpdated" as lastUpdated, cn."rawClose", cn.close, cn.open, cn.high, cn.low, cn.volume, cn."simpleMovingAverage",
                    ((ce."vector" <#> %s::vector) * -1) AS cosine_similarity
                FROM "Company" c
                JOIN "CompanyEmbeddings" ce ON c.id = ce."companyId"
                LEFT JOIN "CompanyDetails" cd ON cd."companyId" = c.id
                LEFT JOIN "CompanyNumericals" cn ON cn."companyId" = c.id
                ORDER BY cosine_similarity DESC
                LIMIT %s
                """,
                (company_vector, limit),
            )

            results = cls.write_company_document_dict(cursor)
            return results
