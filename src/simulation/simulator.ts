import { createArray2DEmpty, createArray2DFilled } from "@/utils/arrays";
import { Satellite } from "./satellite";
import { User } from "./user";
import { Beam, BeamStatus } from "./beam";

export class Simulator {
  public readonly satellites: Satellite[] = [];
  public readonly users: User[] = [];

  constructor() {}

  public *iterBeams(): Iterable<Beam> {
    // return this.satellites.flatMap(s => s.beams);
    for (const sat of this.satellites) {
      for (const b of sat.beams) {
        yield b;
      }
    }
  }

  public update(time: Cesium.JulianDate): void {
    this.satellites.forEach(s => s.update(time));
    this.users.forEach(u => u.update(time));
  }

  //计算重叠函数 = 覆盖总数/它覆盖的用户数
  public countOverlap(beam: Beam): number {
    let D = 0,
      N = 0;
    for (let k = 0; k < this.users.length; k++) {
      if (!beam.cover[k]) continue;
      D++;
      for (const sat of this.satellites) {
        for (const b of sat.beams) {
          N += Number(b.cover[k]);
        }
      }
    }
    return N / D;
  }

  //找出所有需要覆盖用户的下标集合
  coveredUsers(): number[] {
    const coveredUsers = [];
    for (let k = 0; k < this.users.length; k++) {
      for (const beam of this.iterBeams()) {
        if (beam.cover[k]) {
          coveredUsers.push(k);
          break;
        }
      }
    }
    return coveredUsers;
  }

  //检测是否所有用户被覆盖
  isWorking(): boolean {
    const coveredUserIndices = this.coveredUsers();
    for (const idx of coveredUserIndices) {
      let b = false;
      for (const beam of this.iterBeams()) {
        if (beam.cover[idx] && beam.status === BeamStatus.Open) {
          b = true;
          break;
        }
      }
      if (!b) return false;
    }
    return true;
  }

  closeBeam(): void {
    //找出所有待命波束
    const standbyBeams = [];
    for (const beam of this.iterBeams()) {
      if (Number.isFinite(this.countOverlap(beam))) {
        standbyBeams.push(beam);
        beam.status = BeamStatus.Open;
      } else {
        beam.status = BeamStatus.Closed;
      }
    }

    const overlap = standbyBeams.map(i => this.countOverlap(i)); //重复程度

    while (overlap.length > 0) {
      const t = Math.max(...overlap);
      const index = overlap.indexOf(t);
      const beam = standbyBeams[index];
      beam.status = BeamStatus.Standby; // 这里在尝试关掉overlap大的
      if (!this.isWorking()) {
        beam.status = BeamStatus.Open;
      }
      overlap.splice(index, 1);
      standbyBeams.splice(index, 1);
    }
  }
}
