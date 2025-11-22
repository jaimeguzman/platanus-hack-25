import os
from typing import List
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

client = OpenAI(api_key=OPENAI_API_KEY)


class EmbeddingGenerator:
    """
    Wrapper around OpenAI embeddings API.
    Uses text-embedding-3-small by default.
    """

    def __init__(self, model_name: str = "text-embedding-3-small"):
        self.model_name = model_name

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate a single embedding vector for the given text.
        """
        response = client.embeddings.create(
            model=self.model_name,
            input=text,
        )
        embedding = response.data[0].embedding
        return embedding
