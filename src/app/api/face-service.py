from flask import Flask, request, jsonify
from deepface import DeepFace
import os

app = Flask(__name__)

REFERENCE_IMAGE = "public/crew/nipun/user_profile.png"

@app.route("/verify", methods=["POST"])
def verify():
    try:
        file = request.files["file"]
        temp_path = "temp_face.jpg"
        file.save(temp_path)

        result = DeepFace.verify(
            img1_path=REFERENCE_IMAGE,
            img2_path=temp_path,
            model_name="Facenet"
        )

        os.remove(temp_path)
        return jsonify({"verified": result["verified"], "distance": result["distance"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
