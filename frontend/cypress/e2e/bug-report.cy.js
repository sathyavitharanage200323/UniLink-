describe('Bug Report', () => {
  const studentUser = {
    id: 99991,
    name: 'Cypress Student',
    email: 'cypress.student@unilink.edu',
    role: 'STUDENT',
    department: 'Faculty Of Computing',
    notificationEnabled: true,
  }

  beforeEach(() => {
    cy.intercept('GET', '**/api/appointments/student/*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/api/bug-reports/reporter/*', { statusCode: 200, body: [] })
    cy.intercept('GET', '**/api/bug-reports/notifications/*', { statusCode: 200, body: [] })

    cy.visit('/student/home', {
      onBeforeLoad(win) {
        win.localStorage.setItem('unilink_user', JSON.stringify(studentUser))
        win.localStorage.setItem('unilink_appointments', JSON.stringify([]))
      },
    })

    cy.url({ timeout: 15000 }).should('include', '/student/home')
    cy.contains('My Chats').should('be.visible')
  })

  it('should load bug report page', () => {
    cy.visit('/reports')
    cy.url().should('include', '/reports')
    cy.contains('Bug & Issue Reporting').should('be.visible')
  })

  it('should submit a bug report', () => {
    cy.intercept('POST', '**/api/bug-reports', {
      statusCode: 201,
      body: {
        id: 2001,
        title: 'Cypress test report',
        description: 'Test bug description',
        severity: 'LOW',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      },
    }).as('createBugReport')

    cy.visit('/reports')
    cy.get('input[placeholder="Short summary"]').type('Cypress test report')
    cy.get('textarea[placeholder*="Steps"]').type('Test bug description')
    cy.get('select').select('Low')
    cy.contains('button', 'Send report').click()

    cy.wait('@createBugReport')

    // Form reset on successful submission
    cy.get('input[placeholder="Short summary"]').should('have.value', '')
    cy.get('textarea[placeholder*="Steps"]').should('have.value', '')
  })

  it('should validate required fields', () => {
    cy.visit('/reports')
    cy.contains('button', 'Send report').click()
    cy.contains('Title is required').should('be.visible')
  })
})