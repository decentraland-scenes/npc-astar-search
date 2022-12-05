export abstract class Utils {

    static getForwardVectorQ(_rotation: Quaternion): Vector3 {
        return new Vector3(
            2 * (_rotation.x * _rotation.z + _rotation.w * _rotation.y),
            2 * (_rotation.y * _rotation.z - _rotation.w * _rotation.x),
            1 - 2 * (_rotation.x * _rotation.x + _rotation.y * _rotation.y)
        )
    }



    static multiplyVectorByQuaternion(_quaternion: Quaternion, _vector: Vector3): Vector3 {
        const q = [ _quaternion.w, _quaternion.x, _quaternion.y, _quaternion.z ]
        const r = [ 0, _vector.x, _vector.y, _vector.z ]
        const conj = [q[0], -1 * q[1], -1 * q[2], -1 * q[3]]
        const mul = (q: number[], r: number[]): number[] => {
            return [
                r[0] * q[0] - r[1] * q[1] - r[2] * q[2] - r[3] * q[3],
                r[0] * q[1] + r[1] * q[0] - r[2] * q[3] + r[3] * q[2],
                r[0] * q[2] + r[1] * q[3] + r[2] * q[0] - r[3] * q[1],
                r[0] * q[3] - r[1] * q[2] + r[2] * q[1] + r[3] * q[0]
            ]
        }
        const res = mul(mul(q, r), conj)
        return new Vector3(res[1], res[2], res[3])
    }

}


export function pickRandom(str:string[]){
    const val = str[Math.floor(Math.random()*str.length)]
    log("pickRandom",str,"returning",val)
    return val;
  }
   