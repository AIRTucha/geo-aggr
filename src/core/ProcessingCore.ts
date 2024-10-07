import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { SampleStorage } from './apis/SampleStorage'

import { interval, Observable } from 'rxjs'
import { map, shareReplay } from 'rxjs/operators'
import { DataEmitter } from './apis/DataEmitter'
import { EvaluationStorage } from './apis/EvaluationStorage'
import { SourceStorage } from './apis/SourceStorage'
import { FlowLogger, min, max } from '../utils'
import { Quad } from '../services/QTreeSampleStorage/qtree'
import { mean, median, stdev } from 'stats-lite'
import { RawSample, SampleWithKarma } from './models'
import { EvaluatedSample, evaluateQuads, GeoAggregation } from './models/aggregateQuad'
import { sourceKarma, SourceScore } from './models/evaluateKarma'
import { estimateReliability, removeUnreliableQuads } from './models/reliableEstimations'

const TICK_INTERVAL = 1000 * 60

const flowLog = FlowLogger('ProcessingCore')

function reportSampleWithKarmaStats(quads: Quad<SampleWithKarma>[]) {
    const karmas = quads.flatMap(q => q.points.map(p => p.karma))
    const kamaStat = `karma \n\t min: ${min(karmas)} max: ${max(karmas)} mean: ${mean(karmas).toFixed(2)} median: ${median(karmas)} stdev: ${stdev(karmas).toFixed(2)}`
    const pointCounts = quads.map(q => q.points.length)
    const pointCountStat = `points count \n\t min: ${min(pointCounts)} max: ${max(pointCounts)} mean: ${mean(pointCounts).toFixed(2)}`
    return `${karmas.length} samples with \n ${kamaStat} \n ${pointCountStat}`
}

function reportEvaluatedSampleStats(quads: Quad<EvaluatedSample>[]) {
    const risk = quads.flatMap(q => q.points.map(p => p.risk))
    const pointCounts = quads.flatMap(q => q.points.length)
    const pointCountStat = `points count \n\t min: ${min(pointCounts)} max: ${max(pointCounts)} mean: ${mean(pointCounts).toFixed(2)} median: ${median(pointCounts)} stdev: ${stdev(pointCounts).toFixed(2)}`
    const kamaStat = `risk \n\t min: ${min(risk)} max: ${max(risk)} mean: ${mean(risk).toFixed(2)} median: ${median(risk)} stdev: ${stdev(risk).toFixed(2)}`
    return `${risk.length} samples \n ${kamaStat} \n ${pointCountStat}`
}

function reportGeoAggregationStats(results: GeoAggregation[]) {
    const risks = results.map(val => val.risk)
    const riskState = `risk \n\t mean: ${mean(risks).toFixed(2)} median: ${median(risks)} stdev: ${stdev(risks).toFixed(2)}`
    return `${results.length} sectors \n ${riskState}`
}

function sourceScoreStat(sources: SourceScore[]) {
    const karmas = sources.map(val => val.karmaDelta)
    return `${sources.length} sources \n karmas delta \n\t mean: ${mean(karmas).toFixed(2)} median: ${median(karmas)} stdev: ${stdev(karmas).toFixed(2)}`
}

@injectable()
export default class Core {
    @inject(TYPES.SampleStorage)
    private sampleStorage!: SampleStorage

    @inject(TYPES.DataEmitter)
    private dataEmitter!: DataEmitter

    @inject(TYPES.EvaluationStorage)
    private evaluationStorage!: EvaluationStorage

    @inject(TYPES.SourceStorage)
    private sourceStorage!: SourceStorage

    private updateKarma = (karmaChanges: SourceScore[]) =>
        karmaChanges
            .map(karmaChange => {
                this
                    .sourceStorage
                    .updateKarma(
                        karmaChange.sample,
                        karmaChange.karmaDelta
                    )
                this
                    .sampleStorage
                    .markAsProcessed(
                        karmaChange.sample
                    )
            })

    private getKarma = (quad: Quad<RawSample>): Quad<SampleWithKarma> => {
        return {
            ...quad,
            points: quad.points.map(sample => ({
                ...sample,
                karma: this.sourceStorage.getKarma(sample.sourceId)
            }))
        }
    }

    private processDataInBatch() {

        return interval(TICK_INTERVAL)
            .pipe(
                map(() => this.sampleStorage.clearOutdateData()),
                map(outdateSamples => this.sourceStorage.removeSample(outdateSamples)),
                map(() => this.sampleStorage.getData()),
                flowLog('Start risks for'),
                map(quads =>
                    quads.map(this.getKarma)
                ),
                flowLog('Evaluate risks for', reportSampleWithKarmaStats),
            ).pipe(
                map(samples => {
                    const [sd, mean] = this.sourceStorage.getKarmaStat()
                    return estimateReliability(sd, mean, samples)
                }),
                flowLog('Original samples', reportEvaluatedSampleStats),
                map(removeUnreliableQuads),
                flowLog('Reliable samples', reportEvaluatedSampleStats),
            ).pipe(
                map(evaluateQuads),
                flowLog('Evaluation result', reportGeoAggregationStats),
                shareReplay(),
            )
    }

    private updateEmittedData(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                map(evaluations => this.evaluationStorage.update(evaluations)),
                flowLog('Update evaluation result')
            )
            .forEach(
                repository => {
                    this.dataEmitter.emit(repository)
                }
            )
    }

    private filterProcessedPoints = (point: GeoAggregation) => {
        return {
            ...point,
            samples: point.samples.filter(s => this.sampleStorage.isNewSample(s))
        }
    }

    private updateSourcesReliability(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                map(points => points.map(this.filterProcessedPoints)),
                map(points => points.flatMap(sourceKarma)),
                flowLog('Update karma', sourceScoreStat) ,
            )
            .forEach(this.updateKarma)
    }

    run() {
        const geoAggregation = this.processDataInBatch()

        this.updateEmittedData(geoAggregation)
        this.updateSourcesReliability(geoAggregation)
    }
}
