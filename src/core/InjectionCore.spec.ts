import { Container } from 'inversify'
import { Subject } from 'rxjs'
import TYPES from '../di/types'
import { DataInjection } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'
import { SourceStorage } from './apis/SourceStorage'
import InjectionCore from './InjectionCore'
import { RawSample } from './models'

const dataInjectionSubject = new Subject<RawSample>()
const mockDataInjection: DataInjection = {
    listen: jest.fn().mockReturnValue(dataInjectionSubject),
    emit: jest.fn(),
}

const mockSampleStorage: SampleStorage = {
    add: jest.fn(),
    isNewSample: jest.fn().mockReturnValue(true),
    markAsProcessed: jest.fn(),
    clearOutdateData: jest.fn(),
    getData: jest.fn().mockReturnValue([])
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

const testContainer = new Container()

testContainer.bind<DataInjection>(TYPES.DataInjection).toConstantValue(mockDataInjection)
testContainer.bind<SampleStorage>(TYPES.SampleStorage).toConstantValue(mockSampleStorage)
testContainer.bind<SourceStorage>(TYPES.SourceStorage).toConstantValue(mockSourceStorage)

testContainer.bind<InjectionCore>(TYPES.InjectionCore).to(InjectionCore)

describe('InjectionCore', () => {
    let injectionCore: InjectionCore

    beforeEach(() => {
        jest.clearAllMocks()
        injectionCore = testContainer.get<InjectionCore>(TYPES.InjectionCore)
    })

    afterEach(() => {
        mockSamples.length = 0
    })

    it('add values', () => {
        injectionCore.run()
        const mockRawSample: RawSample = {
            risk: 1,
            date: mockLastTime + 61 * 1000,
            sourceId: '1',
            id: '1',
            lat: 1,
            lng: 1,
        }
        dataInjectionSubject.next(mockRawSample)

        expect(mockSourceStorage.updateKarma).not.toBeCalled()
        expect(mockSampleStorage.add).toBeCalledWith(mockRawSample)
        expect(mockSourceStorage.addSample).toBeCalledWith(mockRawSample)
        expect(mockDataInjection.emit).toBeCalledWith('ACCEPTED', mockRawSample.id)
    })

    it('debounce', () => {
        const injectionCore = testContainer.get<InjectionCore>(TYPES.InjectionCore)
        injectionCore.run()
        const mockRawSample: RawSample = {
            risk: 1,
            date: mockLastTime + 59 * 1000,
            sourceId: '1',
            id: '1',
            lat: 1,
            lng: 1,
        }
        dataInjectionSubject.next(mockRawSample)

        expect(mockSourceStorage.updateKarma).not.toBeCalled()
        expect(mockSampleStorage.add).not.toBeCalled()
        expect(mockSourceStorage.addSample).not.toBeCalled()
        expect(mockDataInjection.emit).toBeCalledWith('TOO_HIGH_FREQUENCY', mockRawSample.sourceId)
    })

    it('speed inconsistent', () => {
        const injectionCore = testContainer.get<InjectionCore>(TYPES.InjectionCore)
        injectionCore.run()
        const mockRawSample: RawSample = {
            risk: 1,
            date: mockLastTime + 61 * 1000,
            sourceId: '1',
            id: '1',
            lat: 1,
            lng: 1,
        }
        mockSamples.push({
            risk: 1,
            date: 0,
            sourceId: '1',
            id: '1',
            lat: 12,
            lng: 12,
        })
        dataInjectionSubject.next(mockRawSample)

        expect(mockSourceStorage.updateKarma).toBeCalledWith(mockRawSample, -13)
        expect(mockSampleStorage.add).not.toBeCalled()
        expect(mockSourceStorage.addSample).not.toBeCalled()
        expect(mockDataInjection.emit).toBeCalledWith('INCONSISTENT_MOVEMENT', mockRawSample.sourceId)
    })

    it('samples too close', () => {
        const injectionCore = testContainer.get<InjectionCore>(TYPES.InjectionCore)
        injectionCore.run()
        const mockRawSample: RawSample = {
            risk: 1,
            date: mockLastTime + 61 * 1000,
            sourceId: '1',
            id: '1',
            lat: 1,
            lng: 1,
        }
        mockSamples.push({
            risk: 1,
            date: mockLastTime + 32 * 1000,
            sourceId: '1',
            id: '1',
            lat: 1,
            lng: 1,
        })
        dataInjectionSubject.next(mockRawSample)

        expect(mockSourceStorage.updateKarma).not.toBeCalled()
        expect(mockSampleStorage.add).not.toBeCalled()
        expect(mockSourceStorage.addSample).not.toBeCalled()
        expect(mockDataInjection.emit).toBeCalledWith('ALREADY_REPORTED_LOCATION', mockRawSample.sourceId)
    })
})
