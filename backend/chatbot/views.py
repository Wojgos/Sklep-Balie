from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .logic import StoreChatbot


class ChatbotView(APIView):
    """
    Endpoint do komunikacji z chatbotem.
    POST /api/v1/chatbot/ask/
    Body: { "message": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message', '')

        if not user_message:
            return Response(
                {"error": "Wiadomość nie może być pusta."},
                status=status.HTTP_400_BAD_REQUEST
            )

        bot = StoreChatbot()
        lang = request.LANGUAGE_CODE

        response_text = bot.get_response(user_message, request.user, language=lang)

        return Response({"response": response_text})
