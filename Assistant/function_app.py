import json
import logging
import os
import litellm
import jwt
import azure.functions as func
from prompts.form import FormPrompt

LLM_MODEL = os.environ["IAG_INFERENCE_MODEL"]
LLM_URI = os.environ["IAG_INFERENCE_URI"]
LLM_API_KEY = os.environ["IAG_INFERENCE_API_KEY"]
JWT_SECRET = os.environ["JWT_SECRET"]

app = func.FunctionApp()
litellm.enable_json_schema_validation = True

additional_params = {
    "max_tokens": 512,
    "temperature": 0.5,
}

func.HttpResponse.mimetype = "application/json"

@app.route(
    route="ping", auth_level=func.AuthLevel.ANONYMOUS, methods=["get"]
)
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse({"response": "pong"}, status_code=200)

@app.route(
    route="assistant/form", auth_level=func.AuthLevel.ANONYMOUS, methods=["POST"]
)
def form_assistant(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a request. Form Assistant")
    try:
        token = req.headers.get("authorization").replace("Bearer ", "")

        jwt.decode(
            token, JWT_SECRET, algorithms=["HS256"]
        )

        payload = req.get_json()
        if not payload:
            return func.HttpResponse("Please pass a JSON payload", status_code=400)
        elif not payload.get("description"):
            return func.HttpResponse(
                "Please pass a prompt in the payload", status_code=400
            )
        messages = [
            {"role": "system", "content": FormPrompt.define_form_type()},
            {
                "role": "user",
                "content": "Description to form: " + payload["description"],
            },
        ]

        types = litellm.completion(
            model=LLM_MODEL,
            api_key=LLM_API_KEY,
            base_url=LLM_URI,
            messages=messages,
            **additional_params,
        )
        logging.info(types.choices[0].message.content)

        fields = json.loads(
            types.choices[0].message.content.replace("`", "").replace("json", "")
        )

        logging.info(fields)

        return func.HttpResponse(json.dumps(fields), status_code=200)
    except jwt.ExpiredSignatureError:
        logging.error("Expired token.")
        return func.HttpResponse("Token expirado.", status_code=401)
    except jwt.InvalidTokenError:
        logging.error("Invalid token.")
        return func.HttpResponse("Token inválido.", status_code=401)
    except Exception as e:
        if "cost" in str(e):
            logging.error("Warning: Cost calculation error ignored.")
        else:
            logging.error(f"An unexpected error occurred: {e}")
        return func.HttpResponse("An error occurred", status_code=500)
