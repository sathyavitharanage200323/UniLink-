describe('Lecturer Slot Adding', () => {
  const lecturerUser = {
    id: 7001,
    name: 'Cypress Lecturer',
    email: 'cypress.lecturer@unilink.edu',
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

  function setupCalendarMocks(initialSlots = []) {
    const defaultPreferences = {
      lecturerId: lecturerUser.id,
      slotDuration: 30,
      breakTime: 15,
      workStartTime: '09:00:00',
      workEndTime: '21:00:00',
      maxSlotsPerDay: 12,
      preferredMode: 'BOTH',
    }

    let slots = [...initialSlots]

    cy.intercept('GET', '**/api/appointments/lecturer/*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/api/chat/rooms/user/*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/api/preferences/*', { statusCode: 200, body: defaultPreferences }).as('getPrefs')
    cy.intercept('GET', '**/api/availability/lecturer/*', (req) => {
      req.reply({ statusCode: 200, body: slots })
    }).as('getAvailability')

    cy.intercept('POST', '**/api/availability/lecturer/*/slot', (req) => {
      const created = {
        id: slots.length + 1,
        ...req.body,
        isBlocked: false,
        isBooked: false,
      }

      slots = [...slots, created]
      req.reply({ statusCode: 200, body: created })
    }).as('createSlot')
  }

  it('should add a slot successfully from quick add', () => {
    setupCalendarMocks()
    cy.clock(new Date('2026-04-10T10:00:00').getTime(), ['Date'])

    cy.visit('/lecturer/availability', seedLecturerSession())
    cy.url({ timeout: 15000 }).should('include', '/lecturer/availability')
    cy.contains('Quick Add Slot').should('be.visible')

    cy.get('.sc-quick-add select.sc-input').first().find('option').then(($options) => {
      const validValues = [...$options].map((opt) => opt.value).filter(Boolean)
      expect(validValues.length).to.be.greaterThan(0)
      cy.get('.sc-quick-add select.sc-input').first().select(validValues[0])
    })

    cy.contains('button', 'Add Slot').click()
    cy.wait('@createSlot')

    cy.contains('Slot added successfully.').should('be.visible')
    cy.get('.sc-selected-slot-card').should('have.length.at.least', 1)
  })

  it('should validate start time before adding slot', () => {
    setupCalendarMocks()
    cy.clock(new Date('2026-04-10T10:00:00').getTime(), ['Date'])

    cy.visit('/lecturer/availability', seedLecturerSession())
    cy.url({ timeout: 15000 }).should('include', '/lecturer/availability')

    cy.contains('button', 'Add Slot').click()
    cy.contains('Please select a valid start time.').should('be.visible')
  })
})
