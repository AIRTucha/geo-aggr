import { Container } from 'inversify'
import { Subject } from 'rxjs'
import TYPES from '../di/types'
import { Quad } from '../services/QTreeSampleStorage/qtree'
import { DataEmitter } from './apis/DataEmitter'
import { EvaluationRepository, EvaluationStorage } from './apis/EvaluationStorage'
import { SampleStorage } from './apis/SampleStorage'
import { SourceStorage } from './apis/SourceStorage'
import { RawSample } from './models'
import ProcessingCore from './ProcessingCore'

const mockRawSample: RawSample = {
    risk: 1,
    date: 0,
    sourceId: '1',
    id: '1',
    lat: 1,
    lng: 1,
}

const mockEvaluationResult = { ...mockRawSample, isReliable: true }
const mockData: Quad<RawSample>[] = []
const mockSampleStorage: SampleStorage = {
    add: jest.fn(),
    isNewSample: jest.fn().mockReturnValue(true),
    markAsProcessed: jest.fn(),
    clearOutdateData: jest.fn().mockReturnValue([mockRawSample]),
    getData: jest.fn().mockReturnValue(mockData)
}

const mockSamples: RawSample[] = []
const mockLastTime = 0
const mockSourceStorage: SourceStorage = {
    getSamples: jest.fn().mockReturnValue(mockSamples),
    getKarma: jest.fn().mockReturnValue(0),
    getKarmaStat: jest.fn().mockReturnValue([0, 0]),
    getLastTime: jest.fn().mockReturnValue(mockLastTime),
    addSample: jest.fn(),
    removeSample: jest.fn(),
    updateKarma: jest.fn(),
}

const mockDataEmitter: DataEmitter = {
    emit: jest.fn()
}

const mockEvaluationRepository: EvaluationRepository = {
    get: jest.fn()
}
const mockEvaluationStorage: EvaluationStorage = {
    update: jest.fn().mockReturnValue(mockEvaluationRepository)
}


const testContainer = new Container()


testContainer.bind<SampleStorage>(TYPES.SampleStorage).toConstantValue(mockSampleStorage)
testContainer.bind<SourceStorage>(TYPES.SourceStorage).toConstantValue(mockSourceStorage)
testContainer.bind<DataEmitter>(TYPES.DataEmitter).toConstantValue(mockDataEmitter)
testContainer.bind<EvaluationStorage>(TYPES.EvaluationStorage).toConstantValue(mockEvaluationStorage)

testContainer.bind<ProcessingCore>(TYPES.ProcessingCore).to(ProcessingCore)
// TODO: improve asserts
describe('ProcessingCore', () => {
    let processingCore: ProcessingCore

    beforeEach(() => {
        processingCore = testContainer.get(TYPES.ProcessingCore)
        jest.clearAllMocks()
        jest.useFakeTimers()
        mockData.length = 0
        processingCore.run()
    })
    afterEach(() => {
        jest.useRealTimers()
    })

    it('all quads pass', () => {
        const mockQuad: Quad<RawSample> = {
            lat: 1,
            lng: 1,
            points: [mockRawSample, mockRawSample, mockRawSample, mockRawSample]
        }
        mockData.push(mockQuad)

        jest.advanceTimersByTime(61 * 1000)

        expect(mockSourceStorage.updateKarma).toBeCalled()
        expect(mockSampleStorage.markAsProcessed).toBeCalled()

        // TODO: more specific
        expect(mockEvaluationStorage.update).toBeCalled()
        expect(mockEvaluationStorage.update).not.toBeCalledWith([])
        expect(mockDataEmitter.emit).toBeCalled()
    })
    it('no quads pass', () => {
        const mockQuad: Quad<RawSample> = {
            lat: 1,
            lng: 1,
            points: [mockRawSample, mockRawSample]
        }
        mockData.push(mockQuad)

        jest.advanceTimersByTime(61 * 1000)

        expect(mockEvaluationStorage.update).toBeCalledWith([])
        expect(mockSourceStorage.updateKarma).not.toBeCalled()
        expect(mockSampleStorage.markAsProcessed).not.toBeCalled()
        expect(mockDataEmitter.emit).toBeCalled()
    })
    it('some quads pass', () => {
        const mockQuad1: Quad<RawSample> = {
            lat: 1,
            lng: 1,
            points: [mockRawSample, mockRawSample, mockRawSample, mockRawSample]
        }
        const mockQuad2: Quad<RawSample> = {
            lat: 1,
            lng: 1,
            points: [mockRawSample, mockRawSample]
        }
        mockData.push(mockQuad1)
        mockData.push(mockQuad2)

        jest.advanceTimersByTime(61 * 1000)

        expect(mockSourceStorage.updateKarma).toBeCalled()
        expect(mockSampleStorage.markAsProcessed).toBeCalled()

        // TODO: more specific
        expect(mockEvaluationStorage.update).toBeCalled()
        expect(mockEvaluationStorage.update).not.toBeCalledWith([])
        expect(mockDataEmitter.emit).toBeCalled()
    })
    it('remove points from source storage', () => {
        jest.advanceTimersByTime(61 * 1000)
        expect(mockSourceStorage.removeSample).toBeCalled()
        expect(mockSampleStorage.clearOutdateData).toBeCalled()
    })
    // TODO: test multiple executions
})
