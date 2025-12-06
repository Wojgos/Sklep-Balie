from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Niestandardowe uprawnienie, które pozwala na dostęp
    tylko administratorom (użytkownikom z 'is_staff=True').
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Niestandardowe uprawnienie, które pozwala na odczyt każdemu
    (nawet niezalogowanemu), ale na zapis (POST, PUT, DELETE)
    pozwala tylko administratorom (is_staff=True).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return bool(request.user and request.user.is_staff)


class IsOrderOwnerOrAdmin(permissions.BasePermission):
    """
    Uprawnienie sprawdzające, czy użytkownik jest właścicielem zamówienia
    lub administratorem.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.user == request.user
