class Company:

    database = None

    @classmethod
    def connect(cls, database):
        cls.database = database

    @classmethod
    def nearest_neighbors(cls, query_vector=None, limit=20):
        try:
            with cls.database.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT *
                    FROM "Company"
                    LIMIT %s
                """,
                    (limit,),
                )

                columns = [desc[0] for desc in cursor.description]
                results = list(map(lambda row: dict(zip(columns, row)), cursor.fetchall()))

                return {"data": results, "count": len(results)}
        except Exception as e:
            print(f"Error in nearest_neighbors: {e}")
            return {"results": [], "count": 0, "error": str(e)}
