describe('Bug Report', () => {
  beforeEach(() => {
    // Login as student
    cy.visit('/')
    cy.get('input[type="email"]').type('ravindu.m@unilink.edu')
    cy.get('input[type="password"]').type('Student@123')
    cy.get('button[type="submit"]').click()
    cy.wait(5000) // Wait for login
    cy.contains('Good').should('be.visible') // Confirm home page loaded
  })

  it('should load bug report page', () => {
    cy.visit('/reports')
    cy.url().should('include', '/reports')
    cy.contains('Bug Report').should('be.visible')
  })

  it('should submit a bug report', () => {
    cy.visit('/reports')
    cy.get('textarea[name="description"]').type('Test bug description')
    cy.get('select[name="severity"]').select('LOW')
    cy.get('button[type="submit"]').click()
    cy.get('textarea[name="description"]').should('have.value', '') // Form reset on success
  })

  it('should validate required fields', () => {
    cy.contains('Report Bug').click()
    cy.get('button[type="submit"]').click()
    cy.contains('Description is required').should('be.visible') // Assuming validation
  })
})