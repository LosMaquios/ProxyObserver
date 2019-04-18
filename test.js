import test from 'ava'
import { spy } from 'sinon'

import ProxyObserver from './src'

function setup (value, patch = false) {
  const proxy = ProxyObserver.observe(value, { patch })
  const observer = ProxyObserver.get(proxy)
  const subscriber = spy()

  observer.subscribe(subscriber)

  return {
    proxy,
    observer,
    subscriber
  }
}

test('plain object observing', t => {
  const { proxy, subscriber } = setup({
    key: 'value1'
  })

  proxy.key = 'value2'

  const change = {
    type: 'set',
    old: 'value1',
    value: 'value2',
    key: 'key',
    target: proxy
  }

  t.true(subscriber.calledOnce, '`subscriber` should be called once')
  t.true(subscriber.calledWith(change), '`subscriber` should be called with properly change descriptor')
})

test('plain array observing', t => {
  const { proxy, subscriber } = setup(['a', 'c'])

  proxy[1] = 'b'

  const change = {
    type: 'set',
    old: 'c',
    value: 'b',
    key: '1',
    target: proxy
  }

  t.true(subscriber.calledOnce, '`subscriber` should be called once')
  t.true(subscriber.calledWith(change), '`subscriber` should be called with properly change descriptor')
})

test('array deep observing', t => {
  const { proxy, subscriber } = setup([
    {
      user: 'Joe',
      hobbies: ['Gaming', 'DJ']
    }
  ])

  const target = proxy[0].hobbies

  target.pop()

  const change = {
    type: 'delete',
    old: 'DJ',
    key: '1',
    target
  }

  t.true(subscriber.calledTwice, '`subscriber` should be called twice')
  t.true(subscriber.firstCall.calledWith(change), '`subscriber` should be called with properly change descriptor')
})

test('object deep observing', t => {
  const { proxy, subscriber } = setup({
    sports: [
      'soccer',
      'basketball'
    ]
  })

  const target = proxy.sports

  target.push('football')

  const change = {
    type: 'add',
    value: 'football',
    key: '2',
    target
  }

  t.true(subscriber.calledOnce, '`subscriber` should be called once')
  t.true(subscriber.calledWith(change), '`subscriber` should be called with properly change descriptor')
})

test('plain patch observing', t => {
  const { proxy, subscriber } = setup(new Set(), true)

  proxy.add('a')

  const change = {
    type: 'add',
    value: 'a',
    target: proxy
  }

  t.true(subscriber.calledOnce, '`subscriber` should be called once')
  t.true(subscriber.calledWith(change), '`subscriber` should be called with properly change descriptor')
})

test.todo('deep patch observing')
