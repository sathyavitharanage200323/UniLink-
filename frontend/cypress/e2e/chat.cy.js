describe('Chat Message', () => {
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
    cy.intercept('GET', '**/api/chat/rooms/user/*', { statusCode: 200, body: [] })

    cy.visit('/student/home', {
      onBeforeLoad(win) {
        win.localStorage.setItem('unilink_user', JSON.stringify(studentUser))
        win.localStorage.setItem('unilink_appointments', JSON.stringify([]))
      },
    })

    cy.url({ timeout: 15000 }).should('include', '/student/home')
    cy.contains('My Chats').should('be.visible')
  })

  it('should load chat page', () => {
    cy.contains('button', 'All chats').click()
    cy.url().should('include', '/chat')
    cy.contains('UniLink Chat').should('be.visible')
  })

  it('should display chat interface elements', () => {
    cy.contains('button', 'All chats').click()
    cy.contains('Find Lecturer').should('be.visible')
    cy.contains('Select a conversation to start chatting').should('be.visible')
  })

  // Note: Full WebSocket testing would require additional setup
})