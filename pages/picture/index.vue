<style>
  .swiper {
    height: 100vh;
  }
  .text-pink {
    color: #ff80ab;
  }
  .bg-pink {
    background-color: #ff80ab;
  }
</style>

<template>
  <view class="index">
    <wuc-tab :tab-list="tabList" :tabCur.sync="currentTab" tab-class="text-center text-white bg-pink" select-class="text-white"></wuc-tab>
    <swiper :current="currentTab" class="swiper row" duration="300" :circular="true" indicator-color="rgba(255,255,255,0)" indicator-active-color="rgba(255,255,255,0)" @change="onTabChange">
      <swiper-item v-for="(item,index) in tabList" :key="index">
        <view class="card swiper-item">
          <template v-if="currentTab === index">
            <text class="card-num-view">{{timeCount}}S</text>
            <image
              v-if="info"
              class="card-img"
              :src="info.fileUrl"
              mode="widthFix"
              :animation="fadeAnimation"
              @click="onImageClick"
            ></image>
          </template>
        </view>
      </swiper-item>
    </swiper>
    <uni-fab
      :pattern="fabPattern"
      :content="fabContent"
      direction="vertical"
      @trigger="fabTrigger"
    ></uni-fab>
  </view>
</template>

<script>
  import uniFab from '@/components/uni-fab/uni-fab.vue'
  import WucTab from '@/components/wuc-tab/wuc-tab.vue'
  
  export default {
    components: {
      uniFab,
      WucTab
    },
    data () {
      return {
        info: null,
        // 展现时长，单位秒
        viewTime: 6,
        viewTimeList: [3, 6, 10, 15, 25],
        nextViewTimeIndex: 0,
        viewTimeHandler: null,
        // 倒计时
        timeCount: 0,
        timeCountHandler: null,
        // 动画
        animation: null,
        // 渐隐渐显动画
        fadeAnimation: {},
        // 当前tab项索引
        currentTab: 0,
        // 选项卡列表
        tabList: [],
        // 标识列表
        flagMap: {
          // 是否暂停
          pause: false,
          imageClick: false
        },
        fabPattern: {
          buttonColor: '#ff80ab'
        },
        // 图片双击时长250ms
        imageDblclickDuration: 250
      }
    },
    computed: {
      fabContent () {
        let _t = this
        // 悬浮按钮
        return [
          {
            name: 'next',
            text: '下一个',
            iconPath: require('@/static/next.png'),
            active: false
          },
          {
            name: 'pause',
            text: _t.flagMap.pause ? '播放' : '停止',
            iconPath: _t.flagMap.pause ? require('@/static/play.png') : require('@/static/pause.png'),
            active: false
          },
          {
            name: 'viewTime',
            text: (() => {
              let index = _t.viewTimeList.indexOf(_t.viewTime)
              if (index + 1 < _t.viewTimeList.length) {
                 index++
              } else {
                index = 0
              }
              _t.nextViewTimeIndex = index
              return _t.viewTimeList[index] + 'S'
            })(),
            iconPath: require('@/static/time.png'),
            active: false
          }
        ]
      }
    },
    methods: {
      async init () {
        let _t = this
        await _t.getCategory()
        _t.handleFadeAnimation()
        _t.handleGetInfo()
      },
      async getCategory () {
        let _t = this
        let res = await new Promise((resolve, reject) => {
          uni.request({
              url: _t.$Z.config.api + '/category/list',
              data: {
                type: 'picture'
              },
              success: (res) => {
                resolve(res)
              },
              fail: (err) => {
                reject(err)
              }
          })
        })
        _t.tabList = res ? res.data.data : null
      },
      async getInfo () {
        let _t = this
        let res = await new Promise((resolve, reject) => {
          uni.request({
              url: _t.$Z.config.api + '/random/picture',
              data: {
                type: 'picture',
                category: _t.tabList[_t.currentTab]
              },
              success: (res) => {
                resolve(res)
              },
              fail: (err) => {
                reject(err)
              }
          })
        })
        _t.info = res ? res.data.data : null
        _t.$nextTick(function(){
          _t.animation.opacity(1).step()
          _t.fadeAnimation = _t.animation.export()
        })
      },
      handleGetInfo () {
        let _t = this
        clearInterval(_t.viewTimeHandler)
        let handler = async function () {
          if (_t.flagMap.pause) {
            return
          }
          _t.timeCount = _t.viewTime
          clearInterval(_t.timeCountHandler)
          _t.timeCountHandler = setInterval(function () {
            _t.timeCount--
          }, 1000)
          _t.animation.opacity(0).step()
          _t.fadeAnimation = _t.animation.export()
          setTimeout(_t.getInfo, 1000)
        }
        _t.viewTimeHandler = setInterval(handler, _t.viewTime * 1000)
        handler()
      },
      handleFadeAnimation () {
        let _t = this
        let animation = uni.createAnimation({
          duration: 1000,
          timingFunction: 'ease-in-out',
        })
        _t.animation = animation
      },
      onTabChange (event) {
        let _t = this
        let { current } = event.target
        _t.currentTab = current
        _t.flagMap.pause = false
        _t.handleGetInfo()
      },
      fabTrigger (data) {
        let _t = this
        let { item } = data
        switch (item.name) {
          case 'next':
            _t.flagMap.pause = false
            _t.handleGetInfo()
            break
          case 'pause':
            _t.flagMap.pause = !_t.flagMap.pause
            if (_t.flagMap.pause) {
              clearInterval(_t.viewTimeHandler)
              clearInterval(_t.timeCountHandler)
            } else {
              _t.handleGetInfo()
            }
            break
          case 'viewTime':
            _t.flagMap.pause = false
            _t.viewTime = _t.viewTimeList[_t.nextViewTimeIndex]
            _t.handleGetInfo()
            break
        }
      },
      onImageClick () {
        let _t = this
        // 处理双击
        if (!_t.flagMap.imageClick) {
          _t.flagMap.imageClick = true
          setTimeout(function () {
            _t.flagMap.imageClick = false
          }, _t.imageDblclickDuration)
        } else {
          if (!_t.flagMap.previewImage) {
            // 预览图片
            _t.previewImage() 
          }
        }
      },
      previewImage () {
        let _t = this
        console.log('preivewImage')
        _t.flagMap.previewImage = true
        // 预览图片
        uni.previewImage({
          urls: [_t.info.fileUrl],
          // FIXME 长按操作配置无效
          longPressActions: {
            itemList: ['发送给朋友', '保存图片', '收藏'],
            itemColor: '#007AFF',
            success (data) {
              console.log('选中了第' + (data.tapIndex + 1) + '个按钮,第' + (data.index + 1) + '张图片')
            },
            fail (err) {
              console.log(err.errMsg)
            },
            complete () {
              console.log('longPress complete')
            }
          },
          complete () {
            console.log('previewImage complete')
            setTimeout(function () {
              _t.flagMap.previewImage = false
            }, _t.imageDblclickDuration)
          }
        })
      }
    },
    onLoad () {
      this.init()
    },
    async onPullDownRefresh () {
      let _t = this
      _t.flagMap.pause = false
      await _t.handleGetInfo()
      uni.stopPullDownRefresh()
    },
    onHide () {
      let _t = this
      console.log('hide picture')
      // 隐藏时暂停
      _t.flagMap.pause = !_t.flagMap.pause
      clearInterval(_t.viewTimeHandler)
      clearInterval(_t.timeCountHandler)
    }
  }
</script>
