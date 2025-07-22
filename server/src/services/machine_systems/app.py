import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from models.database import Database
from controllers.search import SearchController

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
searchController = SearchController(database=database)

@app.route("/api/advanced-search", methods=["GET"])
def search():
    try:
        query = request.args.get("query", "")
        limit = request.args.get("limit", "")
        if not query:
            return jsonify({"error": "Query is required"}), 400

        if not limit:
            return jsonify({"error": "Limit is required"}), 400

        if (len(query) >= 400):
            return jsonify({"error": "Query is too long, must be below 600 characters"}), 400

        results = searchController.search(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=os.environ["FLASK_SERVER_PORT"], debug=True)
