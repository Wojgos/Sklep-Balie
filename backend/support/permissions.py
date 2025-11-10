# support/permissions.py
from rest_framework import permissions


class IsTicketOwnerOrAdmin(permissions.BasePermission):
    """
    Uprawnienie sprawdzające, czy użytkownik jest właścicielem zgłoszenia
    lub administratorem.
    """

    def has_object_permission(self, request, view, obj):
        # 'obj' to w tym przypadku obiekt Ticket

        # Admin (is_staff) może wszystko
        if request.user.is_staff:
            return True

        # Właściciel może zobaczyć swoje
        return obj.user == request.user
