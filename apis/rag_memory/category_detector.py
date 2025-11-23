"""
Category detection module using Claude AI.
Automatically categorizes text content into predefined categories.
"""
import logging
from typing import Optional
from anthropic import Anthropic
from config import config

logger = logging.getLogger(__name__)


# Predefined categories (same as in TypeScript frontend)
CATEGORIES = [
    "Salud",
    "Ejercicio y Deporte",
    "Trabajo / Laboral",
    "Estudios / Aprendizaje",
    "Finanzas",
    "Relaciones Amorosas",
    "Familia",
    "Amistades",
    "Vida Social",
    "Hogar y Organización",
    "Alimentación",
    "Estado de Ánimo / Emociones",
    "Proyectos Personales",
    "Viajes",
    "Hobbies",
    "Crecimiento Personal",
    "Tecnología / Gadgets",
    "Creatividad / Arte",
    "Espiritualidad",
    "Eventos Importantes",
    "Metas y Hábitos",
    "Sueño",
    "Mascotas",
    "Compras",
    "Tiempo Libre / Entretenimiento",
]


class CategoryDetector:
    """
    Detects categories for text content using Claude AI.
    Uses function calling to select the most appropriate category.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the category detector.
        
        Args:
            api_key: Anthropic API key (uses config if not provided)
        """
        self.api_key = api_key or config.anthropic_api_key
        if not self.api_key:
            raise ValueError("Anthropic API key is required for category detection")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = config.category_detection_model

    def detect_category(self, text: str) -> Optional[str]:
        """
        Detect the most appropriate category for the given text.
        
        Args:
            text: The text content to categorize
            
        Returns:
            The detected category string, or None if detection fails
            
        Raises:
            Exception: If the API call fails
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for category detection")
            return None

        try:
            # Define the tool for category selection
            tools = [
                {
                    "name": "select_category",
                    "description": (
                        "Select the most appropriate category for the given text content. "
                        "Analyze the main topic and theme to determine which category best fits."
                    ),
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "category": {
                                "type": "string",
                                "enum": CATEGORIES,
                                "description": "The most appropriate category for this content.",
                            },
                        },
                        "required": ["category"],
                    },
                }
            ]

            # System prompt for category detection
            system_prompt = (
                "You are a content categorization assistant. "
                "Your task is to analyze text content and select the SINGLE most appropriate category. "
                "\n\n"
                "Guidelines:\n"
                "- Choose the category that best represents the MAIN topic of the text\n"
                "- If multiple categories could apply, choose the most specific one\n"
                "- Consider the context and intent of the content\n"
                "- Be consistent with similar content patterns\n"
                "\n"
                "You must use the select_category function to return your choice."
            )

            # Call Claude with function calling
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": f"Categorize this text:\n\n{text[:1000]}"  # Limit to first 1000 chars
                    }
                ],
                tools=tools,
                tool_choice={"type": "any"},
                temperature=0.3,
            )

            # Extract the selected category from tool use
            for block in response.content:
                if block.type == "tool_use" and block.name == "select_category":
                    category = block.input.get("category")
                    if category in CATEGORIES:
                        logger.info(f"Detected category: {category}")
                        return category
                    else:
                        logger.warning(f"Invalid category returned: {category}")
                        return None

            logger.warning("No category tool use found in response")
            return None

        except Exception as e:
            logger.error(f"Error detecting category: {e}")
            # Don't raise - return None to allow memory creation without category
            return None


# Global instance for reuse
_detector_instance: Optional[CategoryDetector] = None


def get_category_detector() -> CategoryDetector:
    """
    Get or create a global CategoryDetector instance.
    
    Returns:
        The global CategoryDetector instance
    """
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = CategoryDetector()
    return _detector_instance


def detect_category(text: str) -> Optional[str]:
    """
    Convenience function to detect category using the global detector.
    
    Args:
        text: The text content to categorize
        
    Returns:
        The detected category string, or None if detection fails
    """
    detector = get_category_detector()
    return detector.detect_category(text)

