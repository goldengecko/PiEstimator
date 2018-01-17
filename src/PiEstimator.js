/**
 * This class uses a Monte Carlo simulation to determine an estimate of Pi
 */
class PiEstimator {
  /**
   * @param {object} props: Properties that can override the default settings.
   */
  constructor(props) {
    const defaultArgs = {
      gridsize: 1000,
      circleDiameter: 900,
      n: 100,
      iterations: 10
    }
    this.settings = {...defaultArgs, ...props}
  }

  /**
   * Public method to calculate the required Pi estimate
   *
   * @return the estimate of Pi
   */
  estimatePi = () => {
    // console.log('Estimating using settings: ', this.settings)
    const points = this.generateRandomPoints()
    const percentage = this.inCirclePercentage(points)
    const circleAreaEstimate = this.estimateAreaOfCircle(percentage)
    const piEstimate = this.estimatePiFromArea(circleAreaEstimate)

    // console.log('Pi Estimate: ' + piEstimate)
    return piEstimate
  }

  /**
   * Internal method to generate a random set of points on the grid which is then
   * used to hit test the circle to see what is inside and what is outside.
   */
  generateRandomPoints = () => {
    let points = []
    for (let index = 0; index < this.settings.n; index++) {
      const point = {
        x: Math.floor(Math.random() * this.settings.gridsize),
        y: Math.floor(Math.random() * this.settings.gridsize)
      }
      points.push(point)
    }
    return points
  }

  /**
   * Calculate the percentage of points that are inside the circle.
   *
   * @param {array of x,y objects} points: random points on the grid
   * @return percentage of points that lie in the circle.
   */
  inCirclePercentage = (points) => {
    const radius = this.settings.circleDiameter*0.5
    const centre = this.settings.gridsize*0.5
    let count = 0
    for (const point of points) {
      const dist = Math.sqrt(Math.pow(point.x-centre, 2) + Math.pow(point.y-centre, 2))
      if (dist <= radius) {
        count++
      }
    }
    const percentage = count / points.length * 100
    return percentage
  }

  /**
   * Given the percentage of points in the circle, and the size of the grid, work
   * out the estimate of the area of the circle.
   *
   * @param {number} percentage: Percentage of points in the circle
   * @return Estimated circle area
   */
  estimateAreaOfCircle = (percentage) => {
    const circleArea = percentage / 100 * this.settings.gridsize * this.settings.gridsize
    return circleArea
  }

  /**
   * Given that we know the estimated area of the circle and the diameter, work
   * back to get an estimate of Pi.
   *
   * @param {number} circleArea: the estimate circle area
   * @return Estimate of Pi
   */
  estimatePiFromArea = (circleArea) => {
    const radius = this.settings.circleDiameter*0.5
    const piEstimate = circleArea / Math.pow(radius, 2)
    return piEstimate
  }

}

export default PiEstimator