describe('Chat Message', () => {
  beforeEach(() => {
    // Login as student first
    cy.visit('/')
    cy.get('input[type="email"]').type('ravindu.m@unilink.edu')
    cy.get('input[type="password"]').type('Student@123')
    cy.get('button[type="submit"]').click();
    cy.wait(5000) // Wait for login
    cy.contains('Good').should('be.visible') // Confirm home page loaded
  })

  it('should load chat page', () => {
    cy.contains('All chats').click()
    cy.url().should('include', '/chat')
    cy.contains('Chat').should('be.visible') // Assuming there's a header
  })

  it('should display chat interface elements', () => {
    cy.contains('All chats').click()
    cy.get('input[placeholder*="message"]').should('exist') // Message input
    cy.get('button').contains('Send').should('exist') // Send button
  })

  // Note: Full WebSocket testing would require additional setup
})