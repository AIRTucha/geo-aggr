import { injectable } from 'inversify'
import 'reflect-metadata'
import { SourceStorage } from '../../core/apis/SourceStorage'
import { mean, median, stdev } from 'stats-lite'
import { RawSample } from '../../core/models'

type SampleSource = {
    karma: number
    activeSamples: Set<RawSample>
}

@injectable()
export class LocalSourceStorage implements SourceStorage {
    private readonly sources = new Map<string, SampleSource>()
    getSamples(sourceId: string): RawSample[] {
        return Array.from(
            this.sources
                .get(sourceId)
                ?.activeSamples
                .values() ?? []
        )
    }
    getKarma(sourceId: string): number {
        return this.sources.get(sourceId)?.karma ?? 0
    }
    getKarmaStat(): [number, number] {
        const karmas = Array
            .from(this.sources.values())
            .map(source => source.karma)
        return [stdev(karmas), mean(karmas)]
    }
    getLastTime(sourceId: string): number {
        return this
            .getSamples(sourceId)
            .reduce(
                (max, { date }) => max > date ? max : date,
                0
            )
    }
    addSample(sample: RawSample): void {
        const source = this.sources.get(sample.sourceId)
        if (source) {
            this.updateSource(source, sample)
        } else {
            this.createSource(sample)
        }
    }
    private updateSource(source: SampleSource, sample: RawSample) {
        source.activeSamples.add(sample)
    }
    protected createSource(sample: RawSample, karma = 0) {
        this.sources.set(
            sample.sourceId,
            {
                karma,
                activeSamples: new Set([sample])
            }
        )
    }
    removeSample(samples: RawSample[]): void {
        samples.forEach(sample => {
            this.sources
                .get(sample.sourceId)
                ?.activeSamples
                ?.delete(sample)
        })
    }
    updateKarma(sample: RawSample, karmaDelta: number): void {
        const source = this.sources.get(sample.sourceId)
        if (source) {
            source.karma += karmaDelta
        }
    }
}
