import { EvaluationResult, RawSample } from '.'
import { QPoint, Quad } from '../../services/QTreeSampleStorage/qtree'

export type GeoAggregation = EvaluationResult & { samples: EvaluatedSample[] }
export type EvaluatedSample = RawSample & { isReliable: boolean }

function getMedianRisk(points: QPoint<EvaluatedSample>[]) {
  if (points.length > 0) {
    points.sort((ps1, ps2) => ps1.risk - ps2.risk)
    return points[Math.floor(points.length / 2)].risk
  } else {
    return 0
  }
}

function isReliable(point: QPoint<EvaluatedSample>) {
  return point.isReliable
}

function estimateRisk(quad: Quad<EvaluatedSample>): GeoAggregation {
  const reliablePoints = quad.points.filter(isReliable)
  return {
    risk: getMedianRisk(reliablePoints),
    samples: quad.points,
    ...quad
  }
}

export function evaluateQuads(quads: Quad<EvaluatedSample>[]): GeoAggregation[] {
  return quads
    .map(estimateRisk)
    .filter(quad => quad.risk)
}
