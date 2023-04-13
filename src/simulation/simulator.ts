import { cartDiff } from "@/utils/cesium-math";
import Lazy from "lazy.js";
import { Beam, BeamStatus } from "./beam";
import { BW, CoverFar } from "./beam-constants";
import { Satellite } from "./satellite";
import { User } from "./user";

export class Simulator {
  public readonly satellites: Satellite[] = [];
  public readonly users: User[] = [];

  constructor() {}

  public get beams() {
    return Lazy(this.satellites)
      .map(s => s.beams)
      .flatten();
  }

  public *iterBeams(): Iterable<Beam> {
    for (const sat of this.satellites) {
      for (const b of sat.beams) {
        yield b;
      }
    }
  }

  /**
   * Clear satellites and users.
   */
  public clear(): void {
    this.satellites.length = 0;
    this.users.length = 0;
  }

  public update(time: Cesium.JulianDate): void {
    this.satellites.forEach(s => s.update(time));
    this.users.forEach(u => u.update(time));
  }

  /**
   * 计算重叠函数 = 覆盖总数/它覆盖的用户数
   * @param beam
   * @returns
   */
  public countOverlap(beam: Beam): number {
    let D = 0,
      N = 0;
    for (let k = 0; k < this.users.length; k++) {
      if (!beam.cover[k]) continue;
      D++;
      N += this.beams.filter(b => b.cover[k]).size();
    }
    return N / D;
  }

  /**
   * 找出所有需要覆盖用户的下标集合
   * @returns
   */
  public coveredUsers() {
    return Lazy.range(this.users.length).filter(k => this.beams.some(b => b.cover[k]));
  }

  /**
   * 检测是否所有用户被覆盖
   * @returns
   */
  public isWorking(): boolean {
    // 判断是否每个都被open的覆盖了
    return this.coveredUsers().every(idx => this.beams.some(b => b.coversUser(idx)));
  }

  /**
   * Try to close redundant beams.
   */
  public closeBeam(): void {
    //找出所有待命波束
    const standbyBeams: [Beam, number][] = [];
    for (const beam of this.iterBeams()) {
      const o = this.countOverlap(beam);
      if (Number.isFinite(o)) {
        standbyBeams.push([beam, o]);
        beam.status = BeamStatus.Open;
      } else {
        beam.status = BeamStatus.Closed;
      }
    }
    // 按覆盖率从大到小逐个尝试关掉
    standbyBeams.sort((a, b) => a[1] - b[1]);
    for (const beam of standbyBeams.map(t => t[0])) {
      beam.status = BeamStatus.Standby;
      if (!this.isWorking()) {
        beam.status = BeamStatus.Open;
      }
    }
  }

  /**
   * Get the signal strength of a given position.
   * @param position
   * @returns The signal strength.
   */
  public getSignalStrength(position: Cesium.Cartographic): number {
    let signalStrength = 0;
    const angles = [];

    const positionU = Cesium.Cartographic.toCartesian(position);

    for (const sat of this.satellites) {
      const positionS = sat.currentPosition;

      const vectorUS = cartDiff(positionS, positionU);

      // 波束和用户之间的夹角
      const angleBU = Cesium.Cartesian3.angleBetween(vectorUS, positionS);
      angles.push(angleBU);

      const distance = Cesium.Cartesian3.distance(positionS, positionU);

      if (distance < CoverFar && angleBU < BW) {
        signalStrength += Math.cos(3 * angleBU);
      }
    }

    return signalStrength;
  }
}
