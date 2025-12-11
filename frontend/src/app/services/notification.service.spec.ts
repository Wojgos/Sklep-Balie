import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    // Clean up any remaining notifications and timers
    service.dismissAll();
  });

  describe('Inicjalizacja', () => {
    it('powinien zostać utworzony', () => {
      expect(service).toBeTruthy();
    });

    it('powinien zaczynać z pustą listą notyfikacji', () => {
      const notifications = service.getNotifications();
      expect(notifications.length).toBe(0);
    });

    it('powinien zwracać Observable z notyfikacjami', (done) => {
      let emitted = false;
      service.notifications$.subscribe(notifications => {
        if (!emitted) {
          emitted = true;
          expect(Array.isArray(notifications)).toBe(true);
          done();
        }
      });
    });
  });

  describe('Pokazywanie notyfikacji', () => {
    it('powinien dodać notyfikację z domyślnym typem INFO', () => {
      const message = 'Test notification';
      const id = service.show(message);

      const notifications = service.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].type).toBe(NotificationType.INFO);
      expect(notifications[0].id).toBe(id);
    });

    it('powinien dodać notyfikację z określonym typem', () => {
      service.show('Success message', NotificationType.SUCCESS);

      const notifications = service.getNotifications();
      expect(notifications[0].type).toBe(NotificationType.SUCCESS);
    });

    it('powinien zwrócić unikalny ID notyfikacji', () => {
      const id1 = service.show('Message 1');
      const id2 = service.show('Message 2');

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('powinien ustawić datę utworzenia notyfikacji', () => {
      const beforeTime = new Date().getTime();
      service.show('Test');
      const afterTime = new Date().getTime();

      const notifications = service.getNotifications();
      const createdAt = notifications[0].createdAt.getTime();
      
      expect(createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(createdAt).toBeLessThanOrEqual(afterTime);
    });

    it('powinien emitować notyfikacje przez Observable', (done) => {
      let emissionCount = 0;
      
      service.notifications$.subscribe(notifications => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial empty emission
          expect(notifications.length).toBe(1);
          expect(notifications[0].message).toBe('Test message');
          done();
        }
      });

      service.show('Test message');
    });
  });

  describe('Typy notyfikacji - metody pomocnicze', () => {
    it('showSuccess powinien dodać notyfikację typu SUCCESS', () => {
      service.showSuccess('Success message');

      const notifications = service.getNotifications();
      expect(notifications[0].type).toBe(NotificationType.SUCCESS);
      expect(notifications[0].message).toBe('Success message');
    });

    it('showError powinien dodać notyfikację typu ERROR', () => {
      service.showError('Error message');

      const notifications = service.getNotifications();
      expect(notifications[0].type).toBe(NotificationType.ERROR);
      expect(notifications[0].message).toBe('Error message');
    });

    it('showWarning powinien dodać notyfikację typu WARNING', () => {
      service.showWarning('Warning message');

      const notifications = service.getNotifications();
      expect(notifications[0].type).toBe(NotificationType.WARNING);
      expect(notifications[0].message).toBe('Warning message');
    });

    it('showInfo powinien dodać notyfikację typu INFO', () => {
      service.showInfo('Info message');

      const notifications = service.getNotifications();
      expect(notifications[0].type).toBe(NotificationType.INFO);
      expect(notifications[0].message).toBe('Info message');
    });
  });

  describe('Domyślne czasy trwania', () => {
    it('showSuccess powinien użyć 5000ms domyślnie', fakeAsync(() => {
      service.showSuccess('Success');
      expect(service.getNotifications().length).toBe(1);

      tick(4999);
      expect(service.getNotifications().length).toBe(1);

      tick(1);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('showError powinien użyć 8000ms domyślnie', fakeAsync(() => {
      service.showError('Error');
      expect(service.getNotifications().length).toBe(1);

      tick(7999);
      expect(service.getNotifications().length).toBe(1);

      tick(1);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('showWarning powinien użyć 6000ms domyślnie', fakeAsync(() => {
      service.showWarning('Warning');
      expect(service.getNotifications().length).toBe(1);

      tick(5999);
      expect(service.getNotifications().length).toBe(1);

      tick(1);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('showInfo powinien użyć 5000ms domyślnie', fakeAsync(() => {
      service.showInfo('Info');
      expect(service.getNotifications().length).toBe(1);

      tick(4999);
      expect(service.getNotifications().length).toBe(1);

      tick(1);
      expect(service.getNotifications().length).toBe(0);
    }));
  });

  describe('Auto-dismiss', () => {
    it('powinien automatycznie usunąć notyfikację po określonym czasie', fakeAsync(() => {
      service.show('Test', NotificationType.INFO, 3000);
      
      expect(service.getNotifications().length).toBe(1);
      
      tick(2999);
      expect(service.getNotifications().length).toBe(1);
      
      tick(1);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('NIE powinien automatycznie usuwać gdy duration = null', fakeAsync(() => {
      service.show('Persistent', NotificationType.INFO, null);
      
      expect(service.getNotifications().length).toBe(1);
      
      tick(10000);
      expect(service.getNotifications().length).toBe(1);
    }));

    it('powinien obsłużyć wielokrotne notyfikacje z różnymi czasami', fakeAsync(() => {
      service.show('First', NotificationType.INFO, 1000);
      service.show('Second', NotificationType.INFO, 3000);
      service.show('Third', NotificationType.INFO, 2000);

      expect(service.getNotifications().length).toBe(3);

      tick(1000);
      expect(service.getNotifications().length).toBe(2);
      expect(service.getNotifications()[0].message).toBe('Second');
      expect(service.getNotifications()[1].message).toBe('Third');

      tick(1000);
      expect(service.getNotifications().length).toBe(1);
      expect(service.getNotifications()[0].message).toBe('Second');

      tick(1000);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('powinien nadpisać domyślny duration niestandardową wartością', fakeAsync(() => {
      service.showSuccess('Custom duration', 1000);

      expect(service.getNotifications().length).toBe(1);

      tick(1000);
      expect(service.getNotifications().length).toBe(0);
    }));
  });

  describe('Ręczne zamykanie notyfikacji', () => {
    it('powinien usunąć notyfikację po ID', () => {
      const id = service.show('Test notification');
      
      expect(service.getNotifications().length).toBe(1);
      
      service.dismiss(id);
      expect(service.getNotifications().length).toBe(0);
    });

    it('powinien usunąć tylko określoną notyfikację', () => {
      const id1 = service.show('First');
      service.show('Second');
      const id3 = service.show('Third');

      expect(service.getNotifications().length).toBe(3);

      service.dismiss(id1);
      expect(service.getNotifications().length).toBe(2);
      expect(service.getNotifications()[0].message).toBe('Second');
      expect(service.getNotifications()[1].message).toBe('Third');

      service.dismiss(id3);
      expect(service.getNotifications().length).toBe(1);
      expect(service.getNotifications()[0].message).toBe('Second');
    });

    it('powinien anulować auto-dismiss timer gdy notyfikacja jest ręcznie zamknięta', fakeAsync(() => {
      const id = service.show('Test', NotificationType.INFO, 5000);
      
      expect(service.getNotifications().length).toBe(1);
      
      service.dismiss(id);
      expect(service.getNotifications().length).toBe(0);
      
      // Timer shouldn't fire after manual dismissal
      tick(5000);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('NIE powinien rzucać błędu przy próbie zamknięcia nieistniejącej notyfikacji', () => {
      expect(() => service.dismiss('non-existent-id')).not.toThrow();
      expect(service.getNotifications().length).toBe(0);
    });
  });

  describe('Zamykanie wszystkich notyfikacji', () => {
    it('powinien usunąć wszystkie notyfikacje', () => {
      service.show('First');
      service.show('Second');
      service.show('Third');

      expect(service.getNotifications().length).toBe(3);

      service.dismissAll();
      expect(service.getNotifications().length).toBe(0);
    });

    it('powinien anulować wszystkie auto-dismiss timery', fakeAsync(() => {
      service.show('First', NotificationType.INFO, 3000);
      service.show('Second', NotificationType.INFO, 5000);

      expect(service.getNotifications().length).toBe(2);

      service.dismissAll();
      expect(service.getNotifications().length).toBe(0);

      // Timers shouldn't fire after dismissAll
      tick(10000);
      expect(service.getNotifications().length).toBe(0);
    }));

    it('powinien działać poprawnie gdy nie ma notyfikacji', () => {
      expect(() => service.dismissAll()).not.toThrow();
      expect(service.getNotifications().length).toBe(0);
    });

    it('powinien emitować pustą tablicę przez Observable', (done) => {
      service.show('First');
      service.show('Second');

      setTimeout(() => {
        let emitted = false;
        service.notifications$.subscribe(notifications => {
          if (!emitted && notifications.length === 0) {
            emitted = true;
            expect(notifications.length).toBe(0);
            done();
          }
        });

        service.dismissAll();
      }, 10);
    });
  });

  describe('Pobieranie notyfikacji', () => {
    it('getNotifications powinien zwrócić aktualną tablicę notyfikacji', () => {
      service.show('First');
      service.show('Second');

      const notifications = service.getNotifications();
      expect(notifications.length).toBe(2);
      expect(notifications[0].message).toBe('First');
      expect(notifications[1].message).toBe('Second');
    });

    it('powinien zwrócić snapshot (nie mutować wewnętrznego stanu)', () => {
      service.show('Original');
      
      const notifications1 = service.getNotifications();
      expect(notifications1.length).toBe(1);

      service.show('New');
      
      // Original reference shouldn't be mutated
      expect(notifications1.length).toBe(1);
      
      const notifications2 = service.getNotifications();
      expect(notifications2.length).toBe(2);
    });
  });

  describe('Observable streams', () => {
    it('powinien emitować po każdej zmianie', (done) => {
      const emissions: number[] = [];

      service.notifications$.subscribe(notifications => {
        emissions.push(notifications.length);

        if (emissions.length === 5) {
          expect(emissions).toEqual([0, 1, 2, 3, 2]);
          done();
        }
      });

      service.show('First');
      service.show('Second');
      service.show('Third');
      service.dismiss(service.getNotifications()[0].id);
    });

    it('wielokrotne subskrypcje powinny otrzymywać aktualny stan', (done) => {
      service.show('Existing');

      let count = 0;
      service.notifications$.subscribe(notifications => {
        count++;
        if (count === 1) {
          expect(notifications.length).toBe(1);
        } else if (count === 2) {
          expect(notifications.length).toBe(2);
          done();
        }
      });

      service.show('New');
    });
  });

  describe('Generowanie ID', () => {
    it('każda notyfikacja powinna mieć unikalny ID', () => {
      const ids = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const id = service.show(`Message ${i}`);
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }

      expect(ids.size).toBe(100);
    });

    it('ID powinien zawierać timestamp i losowy element', () => {
      const id = service.show('Test');
      
      expect(id).toContain('notification_');
      expect(id.length).toBeGreaterThan(20); // notification_ + timestamp + _ + random
    });
  });
});
