from rest_framework import permissions


class IsTicketOwnerOrAdmin(permissions.BasePermission):
    """
    Uprawnienie sprawdzające, czy użytkownik jest właścicielem zgłoszenia
    lub administratorem.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        return obj.user == request.user
