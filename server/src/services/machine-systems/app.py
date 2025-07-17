import os

from controllers.search import SearchController

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from models.database import Database


load_dotenv()

os.environ["ROOT_PATH"] = os.path.abspath(os.path.join("..", os.curdir))
current_directory = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)


CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    allow_headers=["Content-Type", "Authorization", "Accept"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)


database = Database()
searchController = SearchController(database)


@app.route("/api/advanced-search", methods=["GET"])
def search():
    try:
        print("Received request for advanced search")
        query = request.args.get("query", "")
        results = searchController.search(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(port=os.environ["FLASK_SERVER_PORT"], debug=True)
    print("Running on port: " + os.environ["FLASK_SERVER_PORT"])
