class Company:

    database = None

    @classmethod
    def connect(cls, database):
        cls.database = database

    @classmethod
    def query_nearest_neighbors(cls, query_vector, k=20):
        """
        Find the nearest neighbors to the query vector using pgvector.

        Args:
            query_vector: The query vector to find nearest neighbors for
            limit: The maximum number of results to return

        Returns:
            A dictionary containing the results and count
        """

        if hasattr(query_vector, "tolist"):
            query_vector = query_vector.tolist()

        with cls.database.cursor() as cursor:
            cursor.execute(
                """
                SELECT c.*, (1 - (ce."vector" <=> %s::vector)) AS cosine_similarity
                FROM "Company" c
                JOIN "CompanyEmbeddings" ce ON c.id = ce."companyId"
                ORDER BY cosine_similarity DESC
                LIMIT %s
                """,
                (query_vector, k),
            )
            columns = [desc[0] for desc in cursor.description]
            results = list(map(lambda row: dict(zip(columns, row)), cursor.fetchall()))
        return {"data": results, "count": len(results)}

    @classmethod
    def company_nearest_neighbors(cls, company_vector, k=1):
        """
        Find the nearest neighbors to the company vector using pgvector.

        Args:
            company_vector: The query vector to find nearest neighbors for
            limit: The maximum number of results to return

        Returns:
            A dictionary containing the results and count
        """

        if hasattr(company_vector, "tolist"):
            company_vector = company_vector.tolist()

        with cls.database.cursor() as cursor:
            cursor.execute(
                """
                SELECT c.*, (1 - (ce."vector" <=> %s::vector)) AS cosine_similarity
                FROM "Company" c
                JOIN "CompanyEmbeddings" ce ON c.id = ce."companyId"
                ORDER BY cosine_similarity DESC
                LIMIT %s
                """,
                (company_vector, k),
            )
            columns = [desc[0] for desc in cursor.description]
            results = list(map(lambda row: dict(zip(columns, row)), cursor.fetchall()))
        return {"data": results, "count": len(results)}
