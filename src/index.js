import {toArray} from 'lodash'
import cluster from 'cluster'
import os from 'os'

import PiEstimator from './PiEstimator'

/* Tell ESLint not to worry about process */
/*global process*/

const args = toArray(process.argv.slice(2))

// If user asks for help, show it to them
if (args.indexOf('--help') !== -1) {
  console.info('\x1b[33mUsage:\x1b[0m (all options are optional and will use defaults if not specified)')
  console.info('\t\x1b[32mgridsize\x1b[0m: size of the grid, \x1b[1mdefault 1000\x1b[0m')
  console.info('\t\x1b[32mcircleDiameter\x1b[0m: size of the circle, \x1b[1mdefault 900\x1b[0m')
  console.info('\t\x1b[32mn\x1b[0m: number of points to generate, \x1b[1mdefault 100\x1b[0m')
  console.info('\t\x1b[32miterations\x1b[0m: number of iterations of the process to work out the average Pi value, \x1b[1mdefault 10\x1b[0m')
  console.info('\n\x1b[33mExample:\x1b[0m\n\tnode dist/index.js n=1000 iterations=20')
  process.exit()
}

if (cluster.isMaster) {
  // Try to process the args
  let processedArgs = {}
  for (const arg of args) {
    const split = arg.split('=')
    if (split.length ==2 && !isNaN(parseInt(split[1]))) {
      processedArgs[split[0]] = parseInt(split[1])
    } else {
      console.warn('Error parsing args. Please use \x1b[33m--help\x1b[0m to see the options.')
      process.exit()
    }
  }

  // The only arg we are concerned about here is the number of iterations, since we will spawn a
  // worker for each one.
  const numIterations = (processedArgs.iterations) ? processedArgs.iterations : 10

  // We will fork a number of worker processes up to the number of CPUs in order to process
  // the iterations
  const numWorkers = Math.min(os.cpus().length, numIterations)
  let accumulatedPi = 0
  let assignedIterations = 0
  let doneIterations = 0

  for (let index = 0; index < numWorkers; index++) {
    cluster.fork()
  }

  cluster.on('online', (worker) => {
    // When our worker is available, register to receive messages saying that it's ready
    // to process, or finished processing an iteration.
    worker.on('message', (message) => {
      if (message.type === 'readyToProcess') {
        if (assignedIterations < numIterations) {
          worker.send({type:'processIteration'})
          assignedIterations++
        }
      } else if (message.type === 'result') {
        accumulatedPi += message.value
        doneIterations++
        console.info('Received pi estimate ' + doneIterations + ' of ' + message.value)
        if (assignedIterations < numIterations) {
          worker.send({type:'processIteration'})
          assignedIterations++
        }
        if (doneIterations === numIterations) {
          console.info('Average Pi value was ' + accumulatedPi / numIterations)
          // Try to get the workers to shut down gracefully, but kill them if they don't
          let workerIds = []
          for (const wid in cluster.workers) {
            workerIds.push(wid)
          }
          for (const wid of workerIds) {
            cluster.workers[wid].send({type:'shutdown'})
            setTimeout(() => {
              if (cluster.workers[wid]) {
                cluster.workers[wid].kill('SIGKILL')
              }
            }, 1000)
          }
        }
      }
    })
    worker.send({type:'configuration', args:processedArgs})
  })

  cluster.on('exit', (worker, code, signal) => {
    if (code !== 42 && doneIterations < numIterations) {
      console.error('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal)
      // It must have died an unnatural death. Create a replacement worker
      assignedIterations--
      cluster.fork()
    }
  })

} else {
  // Worker process will sit here waiting for a request from the server
  let estimator = null
  process.on('message', (message) => {
    if (message.type === 'configuration') {
      estimator = new PiEstimator(message.args)
      process.send({type:'readyToProcess'})
    } else if (message.type === 'processIteration') {
      let estimatedPi = estimator.estimatePi()
      process.send({type:'result', value:estimatedPi})
    } else if (message.type === 'shutdown') {
      //   console.log('shutting down gracefully ' + process.pid)
      process.exit(42)
    }
  })

}

