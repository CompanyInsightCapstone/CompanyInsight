import os
import psycopg2
import psycopg2.extras


class Database:
    def __init__(self):
        self.conn = psycopg2.connect(
            database=os.environ["DATABASE_NAME"],
            user=os.environ["DATABASE_USER"],
            host=os.environ["DATABASE_HOST"],
            password=os.environ["DATABASE_PASSWORD"],
            port=os.environ["DATABASE_PORT"],
        )

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

    def cursor(self):
        return self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
