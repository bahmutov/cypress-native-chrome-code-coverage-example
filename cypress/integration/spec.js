/// <reference types="cypress" />

// beforeEach(() => {
//   console.log('before test')
//   cy.task('beforeTest')
// })

// afterEach(() => {
//   console.log('after test')
//   cy.task('afterTest')
// })

it('adds numbers', () => {
  // cy.wait(1000)
  cy.visit('/')
  cy.contains('Hello world').should('be.visible')
  // cy.wait(1000)
})
