import test from 'ava'
import { spy } from 'sinon'

import ProxyObserver from '.'

test('plain object observing', t => {
  const proxy = ProxyObserver.observe({
    key: 'value1'
  })

  const observer = ProxyObserver.get(proxy)
  const subscriber = spy()

  observer.subscribe(subscriber)

  proxy.key = 'value2'

  const change = {
    type: 'set',
    old: 'value1',
    value: 'value2',
    property: 'key',
    target: proxy
  }

  t.true(subscriber.calledOnce, '`subscriber` should be called once')
  t.true(subscriber.calledWith(change), '`subscriber` should be called with properly change descriptor')
})

test('plain array observing', t => {
  const proxy = ProxyObserver.observe(['a', 'c'])

  const observer = ProxyObserver.get(proxy)
  const subscriber = spy()

  observer.subscribe(subscriber)

  proxy[1] = 'b'

  const change = {
    type: 'set',
    old: 'c',
    value: 'b',
    property: '1',
    target: proxy
  }

  t.true(subscriber.calledOnce, '`subscriber` should be called once')
  t.true(subscriber.calledWith(change), '`subscriber` should be called with properly change descriptor')
})
