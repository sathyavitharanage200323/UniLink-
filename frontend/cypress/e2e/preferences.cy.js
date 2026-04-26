describe('Lecturer Preferences', () => {
  const lecturerUser = {
    id: 7002,
    name: 'Preference Lecturer',
    email: 'prefs.lecturer@unilink.edu',
    role: 'LECTURER',
    department: 'Faculty Of Computing',
    notificationEnabled: true,
  }

  function seedLecturerSession() {
    return {
      onBeforeLoad(win) {
        win.localStorage.setItem('unilink_user', JSON.stringify(lecturerUser))
        win.localStorage.setItem('unilink_appointments', JSON.stringify([]))
      },
    }
  }

  function setupPreferenceMocks() {
    const initialPrefs = {
      lecturerId: lecturerUser.id,
      slotDuration: 30,
      breakTime: 15,
      workStartTime: '09:00:00',
      workEndTime: '21:00:00',
      maxSlotsPerDay: 12,
      preferredMode: 'BOTH',
    }

    cy.intercept('GET', '**/api/appointments/lecturer/*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/api/chat/rooms/user/*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/api/preferences/*', { statusCode: 200, body: initialPrefs }).as('getPrefs')
    cy.intercept('POST', '**/api/preferences', (req) => {
      req.reply({ statusCode: 200, body: req.body })
    }).as('savePrefs')
  }

  it('should save lecturer preferences successfully', () => {
    setupPreferenceMocks()

    cy.visit('/lecturer/preferences', seedLecturerSession())
    cy.url({ timeout: 15000 }).should('include', '/lecturer/preferences')

    cy.get('select[name="slotDuration"]').select('45 Minutes')
    cy.get('select[name="breakTime"]').select('15 Minutes')
    cy.get('input[name="workStartTime"]').clear().type('09:00')
    cy.get('input[name="workEndTime"]').clear().type('18:00')

    cy.contains('button', 'Save Preferences').click()
    cy.wait('@savePrefs').its('request.body').should((body) => {
      expect(body.slotDuration).to.eq(45)
      expect(body.breakTime).to.eq(15)
      expect(body.workStartTime).to.eq('09:00')
      expect(body.workEndTime).to.eq('18:00')
    })

    cy.contains('Preferences saved successfully').should('be.visible')
  })

  it('should validate end time is greater than start time', () => {
    setupPreferenceMocks()

    cy.visit('/lecturer/preferences', seedLecturerSession())
    cy.url({ timeout: 15000 }).should('include', '/lecturer/preferences')

    cy.get('input[name="workStartTime"]').clear().type('12:00')
    cy.get('input[name="workEndTime"]').clear().type('11:00')
    cy.contains('button', 'Save Preferences').click()

    cy.contains('End time must be greater than start time').should('be.visible')
  })
})
